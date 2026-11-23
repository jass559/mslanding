import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { Content_Fixture } from '../../content/contentFixture';
import {
  createContactFormState,
  EMPTY_CONTACT_FORM_VALUES,
  submitContactForm,
  type ContactFormState,
  type ContactFormValues,
} from './contactClient';
import type { ContactField } from '@shared/validation/contactSchema';

const CONTACT_FIELDS = [
  'fullName',
  'email',
  'phone',
  'service',
  'message',
] as const satisfies readonly ContactField[];

type ContactControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface ContactFormProps {
  /** Allows the page and tests to provide the client transport without Prisma access. */
  fetcher?: typeof fetch;
  initialValues?: ContactFormValues;
}

const controlClassName =
  'mt-2 min-h-12 w-full rounded-lg border border-brand-border bg-brand-surface-raised px-4 py-3 text-base text-brand-text-primary placeholder:text-brand-text-secondary focus-visible:border-brand-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-60';
const errorClassName = 'mt-2 text-sm font-medium text-red-300';

function errorId(field: ContactField): string {
  return `contact-${field}-error`;
}

function optionalHintId(field: ContactField): string {
  return `contact-${field}-optional`;
}

function getFieldError(
  state: ContactFormState,
  field: ContactField,
): string | undefined {
  const messages = state.fieldErrors[field];
  return messages && messages.length > 0 ? messages.join(' ') : undefined;
}

function getDescribedBy(
  field: ContactField,
  hasError: boolean,
): string | undefined {
  const describedBy: string[] = [];

  if (field === 'phone') {
    describedBy.push(optionalHintId(field));
  }

  if (hasError) {
    describedBy.push(errorId(field));
  }

  return describedBy.length > 0 ? describedBy.join(' ') : undefined;
}

function getStatusMessage(
  state: ContactFormState,
  successMessage: string,
): string {
  if (state.formError) {
    return state.formError;
  }

  switch (state.status) {
    case 'validating':
      return 'Validando los datos del formulario…';
    case 'submitting':
      return 'Enviando tu solicitud…';
    case 'validationError':
      return 'Revisa los errores indicados e inténtalo de nuevo.';
    case 'success':
      return successMessage;
    default:
      return '';
  }
}

function isErrorStatus(status: ContactFormState['status']): boolean {
  return (
    status === 'validationError' ||
    status === 'serverError' ||
    status === 'networkError'
  );
}

/**
 * Accessible presentation for the canonical contact fields and submission
 * states. Transport and validation remain in contactClient; this component
 * never imports or calls Prisma.
 */
export function ContactForm({
  fetcher,
  initialValues = EMPTY_CONTACT_FORM_VALUES,
}: ContactFormProps = {}): JSX.Element {
  const [state, setState] = useState<ContactFormState>(() =>
    createContactFormState(initialValues),
  );
  const fieldRefs = useRef<
    Partial<Record<ContactField, ContactControl>>
  >({});
  const formContent = Content_Fixture.contact.form;
  const isSubmitting = state.status === 'submitting';
  const liveMessage = getStatusMessage(state, formContent.successMessage);
  const hasError = isErrorStatus(state.status);

  useEffect(() => {
    if (!hasError) {
      return;
    }

    const firstInvalidField = CONTACT_FIELDS.find(
      (field) => (state.fieldErrors[field]?.length ?? 0) > 0,
    );

    if (firstInvalidField) {
      fieldRefs.current[firstInvalidField]?.focus();
    }
  }, [hasError, state.fieldErrors]);

  function setFieldRef(field: ContactField, element: ContactControl | null): void {
    if (element) {
      fieldRefs.current[field] = element;
    } else {
      delete fieldRefs.current[field];
    }
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ): void {
    const field = event.target.name as ContactField;

    if (!CONTACT_FIELDS.includes(field)) {
      return;
    }

    const value = event.target.value;
    setState((currentState) => ({
      status: 'editing',
      values: {
        ...currentState.values,
        [field]: value,
      },
      fieldErrors: {
        ...currentState.fieldErrors,
        [field]: undefined,
      },
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const submissionFetcher = fetcher ?? globalThis.fetch;
    void submitContactForm(state.values, submissionFetcher, {
      onStateChange: setState,
    });
  }

  return (
    <form
      id="contact-form"
      noValidate
      aria-labelledby="contact-form-title"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
      className="brand-surface-raised min-w-0 space-y-6 rounded-2xl border p-6 sm:p-8"
    >
      <div>
        <h2
          id="contact-form-title"
          className="text-2xl font-semibold text-brand-text-primary"
        >
          {formContent.title}
        </h2>
        <p className="mt-2 text-sm text-brand-text-secondary">
          {formContent.helperText}
        </p>
      </div>

      <div
        id="contact-form-status"
        aria-live={hasError ? 'assertive' : 'polite'}
        aria-atomic="true"
        role={hasError ? 'alert' : 'status'}
        className={
          liveMessage
            ? hasError
              ? 'rounded-lg border border-red-400/60 bg-red-950/40 px-4 py-3 text-sm text-red-100'
              : 'rounded-lg border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text-secondary'
            : 'sr-only'
        }
      >
        {liveMessage}
      </div>

      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="fullName"
              className="text-sm font-semibold text-brand-text-primary"
            >
              {formContent.labels.fullName}
            </label>
            <span aria-hidden="true" className="text-brand-accent">
              {formContent.requiredMarker}
            </span>
          </div>
          <input
            ref={(element) => setFieldRef('fullName', element)}
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={state.values.fullName}
            onChange={handleChange}
            aria-invalid={Boolean(getFieldError(state, 'fullName'))}
            aria-describedby={
              getDescribedBy('fullName', Boolean(getFieldError(state, 'fullName')))
            }
            className={controlClassName}
          />
          {getFieldError(state, 'fullName') ? (
            <p id={errorId('fullName')} className={errorClassName}>
              {getFieldError(state, 'fullName')}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-brand-text-primary"
            >
              {formContent.labels.email}
            </label>
            <span aria-hidden="true" className="text-brand-accent">
              {formContent.requiredMarker}
            </span>
          </div>
          <input
            ref={(element) => setFieldRef('email', element)}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={state.values.email}
            onChange={handleChange}
            aria-invalid={Boolean(getFieldError(state, 'email'))}
            aria-describedby={
              getDescribedBy('email', Boolean(getFieldError(state, 'email')))
            }
            className={controlClassName}
          />
          {getFieldError(state, 'email') ? (
            <p id={errorId('email')} className={errorClassName}>
              {getFieldError(state, 'email')}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="phone"
              className="text-sm font-semibold text-brand-text-primary"
            >
              {formContent.labels.phone}
            </label>
            <span
              id={optionalHintId('phone')}
              className="text-sm text-brand-text-secondary"
            >
              {formContent.optionalLabel}
            </span>
          </div>
          <input
            ref={(element) => setFieldRef('phone', element)}
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={state.values.phone}
            onChange={handleChange}
            aria-invalid={Boolean(getFieldError(state, 'phone'))}
            aria-describedby={getDescribedBy(
              'phone',
              Boolean(getFieldError(state, 'phone')),
            )}
            className={controlClassName}
          />
          {getFieldError(state, 'phone') ? (
            <p id={errorId('phone')} className={errorClassName}>
              {getFieldError(state, 'phone')}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="service"
              className="text-sm font-semibold text-brand-text-primary"
            >
              {formContent.labels.service}
            </label>
            <span aria-hidden="true" className="text-brand-accent">
              {formContent.requiredMarker}
            </span>
          </div>
          <input
            ref={(element) => setFieldRef('service', element)}
            id="service"
            name="service"
            type="text"
            required
            value={state.values.service}
            onChange={handleChange}
            aria-invalid={Boolean(getFieldError(state, 'service'))}
            aria-describedby={
              getDescribedBy('service', Boolean(getFieldError(state, 'service')))
            }
            className={controlClassName}
          />
          {getFieldError(state, 'service') ? (
            <p id={errorId('service')} className={errorClassName}>
              {getFieldError(state, 'service')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <label
            htmlFor="message"
            className="text-sm font-semibold text-brand-text-primary"
          >
            {formContent.labels.message}
          </label>
          <span aria-hidden="true" className="text-brand-accent">
            {formContent.requiredMarker}
          </span>
        </div>
        <textarea
          ref={(element) => setFieldRef('message', element)}
          id="message"
          name="message"
          required
          rows={6}
          value={state.values.message}
          onChange={handleChange}
          aria-invalid={Boolean(getFieldError(state, 'message'))}
          aria-describedby={
            getDescribedBy('message', Boolean(getFieldError(state, 'message')))
          }
          className={`${controlClassName} resize-y`}
        />
        {getFieldError(state, 'message') ? (
          <p id={errorId('message')} className={errorClassName}>
            {getFieldError(state, 'message')}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="brand-cta inline-flex min-h-12 w-full items-center justify-center rounded-lg px-5 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cta-hover disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
      >
        {isSubmitting ? formContent.submittingLabel : formContent.submitLabel}
      </button>
    </form>
  );
}

/** Canonical task name retained as an alias for consumers that use it literally. */
export const Contact_Form = ContactForm;
