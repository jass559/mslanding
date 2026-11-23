import {
  Contact_Schema,
  normalizeContactInput,
  type ContactField,
  type ContactLeadInput,
} from '@shared/validation/contactSchema';
import type {
  ContactFormState,
  ContactFormStatus,
  ContactFormValues,
  ContactCreatedResponse,
} from '@shared/contracts/contact';

export type {
  ContactFormState,
  ContactFormStatus,
  ContactFormValues,
} from '@shared/contracts/contact';

export const CONTACT_ENDPOINT = '/api/contact' as const;
export const CONTACT_REQUEST_TIMEOUT_MS = 10_000;

export const EMPTY_CONTACT_FORM_VALUES: ContactFormValues = {
  fullName: '',
  email: '',
  phone: '',
  service: '',
  message: '',
};

const CONTACT_FIELDS = [
  'fullName',
  'email',
  'phone',
  'service',
  'message',
] as const satisfies readonly ContactField[];

type ContactFormStateListener = (state: ContactFormState) => void;

export interface SubmitContactFormOptions {
  /** Allows the presentation layer to expose validating/submitting transitions. */
  onStateChange?: ContactFormStateListener;
  /** Kept configurable for deterministic tests while production uses the default. */
  timeoutMs?: number;
}

const DEFAULT_SERVER_ERROR = 'No se pudo enviar la solicitud. Intenta de nuevo.';
const SERVER_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: 'Los datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.',
  405: 'No se pudo enviar la solicitud. Intenta de nuevo.',
  429: 'No se pudo enviar la solicitud en este momento. Intenta de nuevo más tarde.',
  500: 'No se pudo guardar la solicitud. Intenta de nuevo.',
};
const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Keeps the form state shape in one place and returns fresh value/error objects.
 * The presentation layer can use this for the initial idle state.
 */
export function createContactFormState(
  values: ContactFormValues = EMPTY_CONTACT_FORM_VALUES,
  status: ContactFormStatus = 'idle',
): ContactFormState {
  return {
    status,
    values: copyContactFormValues(values),
    fieldErrors: {},
  };
}

/** Returns the editing state used after a user changes a form control. */
export function createEditingContactFormState(
  values: ContactFormValues,
): ContactFormState {
  return createContactFormState(values, 'editing');
}

/**
 * Validates, transports, and reduces one contact submission to a presentational
 * state. It never mutates the values supplied by the form.
 */
export async function submitContactForm(
  values: ContactFormValues,
  fetcher: typeof fetch,
  options: SubmitContactFormOptions = {},
): Promise<ContactFormState> {
  const originalValues = copyContactFormValues(values);
  const emit = options.onStateChange ?? (() => undefined);

  emit(makeState('validating', originalValues));

  const parsed = Contact_Schema.safeParse(values);

  if (!parsed.success) {
    return emitAndReturn(
      emit,
      makeState('validationError', originalValues, toFieldErrors(parsed.error.issues)),
    );
  }

  const normalizedInput = normalizeContactInput(parsed.data);
  const existingSubmission = getActiveSubmission(fetcher);

  if (existingSubmission) {
    return existingSubmission;
  }

  const submission = executeSubmission(
    originalValues,
    normalizedInput,
    fetcher,
    emit,
    options.timeoutMs ?? CONTACT_REQUEST_TIMEOUT_MS,
  );

  rememberSubmission(fetcher, submission);
  return submission;
}

interface ContactRequestBody {
  fullName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

async function executeSubmission(
  originalValues: ContactFormValues,
  normalizedInput: ContactLeadInput,
  fetcher: typeof fetch,
  emit: ContactFormStateListener,
  timeoutMs: number,
): Promise<ContactFormState> {
  emit(makeState('submitting', originalValues));

  try {
    const response = await fetchWithTimeout(
      fetcher,
      toRequestBody(normalizedInput),
      timeoutMs,
    );
    const responseBody = await readJson(response);

    if (response.status !== 201 || !isContactCreatedResponse(responseBody)) {
      const serverState = makeState(
        'serverError',
        originalValues,
        getResponseFieldErrors(responseBody),
        getServerErrorMessage(response.status, responseBody),
      );
      return emitAndReturn(emit, serverState);
    }

    return emitAndReturn(
      emit,
      makeState('success', EMPTY_CONTACT_FORM_VALUES),
    );
  } catch {
    return emitAndReturn(
      emit,
      makeState('networkError', originalValues, {}, NETWORK_ERROR_MESSAGE),
    );
  }
}

function toRequestBody(input: ContactLeadInput): ContactRequestBody {
  // Keep all five canonical keys in the wire payload. The server's shared
  // schema turns an empty optional phone into absence before persistence.
  return {
    fullName: input.fullName,
    email: input.email,
    phone: input.phone ?? '',
    service: input.service,
    message: input.message,
  };
}

async function fetchWithTimeout(
  fetcher: typeof fetch,
  body: ContactRequestBody,
  timeoutMs: number,
): Promise<Response> {
  const controller =
    typeof AbortController === 'undefined' ? undefined : new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const request = fetcher(CONTACT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller?.abort();
      reject(new Error('Contact request timed out.'));
    }, Math.max(0, timeoutMs));
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isContactCreatedResponse(
  value: unknown,
): value is ContactCreatedResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Partial<ContactCreatedResponse>;
  return response.success === true && response.code === 'CONTACT_CREATED';
}

function toFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Partial<Record<ContactField, string[]>> {
  const fieldErrors: Partial<Record<ContactField, string[]>> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (
      typeof field !== 'string' ||
      !CONTACT_FIELDS.includes(field as ContactField)
    ) {
      continue;
    }

    const fieldName = field as ContactField;
    fieldErrors[fieldName] = [
      ...(fieldErrors[fieldName] ?? []),
      issue.message,
    ];
  }

  return fieldErrors;
}

function getResponseFieldErrors(
  value: unknown,
): Partial<Record<ContactField, string[]>> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== 'object') {
    return {};
  }

  const fields = (error as { fields?: unknown }).fields;
  if (!fields || typeof fields !== 'object') {
    return {};
  }

  const fieldErrors: Partial<Record<ContactField, string[]>> = {};

  for (const field of CONTACT_FIELDS) {
    const messages = (fields as Record<string, unknown>)[field];
    if (
      Array.isArray(messages) &&
      messages.every((message): message is string => typeof message === 'string')
    ) {
      fieldErrors[field] = messages;
    }
  }

  return fieldErrors;
}

function getServerErrorMessage(status: number, value: unknown): string {
  if (status === 400) {
    const responseMessage = getResponseMessage(value);
    if (responseMessage) {
      return responseMessage;
    }
  }

  return SERVER_ERROR_MESSAGES[status] ?? DEFAULT_SERVER_ERROR;
}

function getResponseMessage(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
}

function makeState(
  status: ContactFormStatus,
  values: ContactFormValues,
  fieldErrors: Partial<Record<ContactField, string[]>> = {},
  formError?: string,
): ContactFormState {
  const state: ContactFormState = {
    status,
    values: copyContactFormValues(values),
    fieldErrors: copyFieldErrors(fieldErrors),
  };

  if (formError) {
    state.formError = formError;
  }

  return state;
}

function emitAndReturn(
  emit: ContactFormStateListener,
  state: ContactFormState,
): ContactFormState {
  emit(state);
  return state;
}

function copyContactFormValues(values: ContactFormValues): ContactFormValues {
  return {
    fullName: values.fullName,
    email: values.email,
    phone: values.phone,
    service: values.service,
    message: values.message,
  };
}

function copyFieldErrors(
  fieldErrors: Partial<Record<ContactField, string[]>>,
): Partial<Record<ContactField, string[]>> {
  const copied: Partial<Record<ContactField, string[]>> = {};

  for (const field of CONTACT_FIELDS) {
    if (fieldErrors[field]) {
      copied[field] = [...fieldErrors[field]];
    }
  }

  return copied;
}

const activeSubmissions = new WeakMap<
  typeof fetch,
  Promise<ContactFormState>
>();

function getActiveSubmission(
  fetcher: typeof fetch,
): Promise<ContactFormState> | undefined {
  return activeSubmissions.get(fetcher);
}

function rememberSubmission(
  fetcher: typeof fetch,
  submission: Promise<ContactFormState>,
): void {
  activeSubmissions.set(fetcher, submission);
  void submission.then(
    () => removeSubmission(fetcher, submission),
    () => removeSubmission(fetcher, submission),
  );
}

function removeSubmission(
  fetcher: typeof fetch,
  submission: Promise<ContactFormState>,
): void {
  if (activeSubmissions.get(fetcher) === submission) {
    activeSubmissions.delete(fetcher);
  }
}
