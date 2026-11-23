import { z } from 'zod';

const optionalPhoneSchema = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+()\d\s.-]+$/)
    .optional(),
);

/**
 * Shared strict contract for contact form submissions.
 *
 * Empty phone values are omitted from the parsed output so persistence layers
 * can map them to NULL, while presentation state keeps phone as a string.
 */
export const Contact_Schema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    phone: optionalPhoneSchema,
    service: z.string().trim().min(1).max(100),
    message: z.string().trim().min(10).max(2000),
  })
  .strict();

/** Canonical camel-case export used by client and server modules. */
export const contactSchema = Contact_Schema;

export type ContactLeadInput = z.infer<typeof Contact_Schema>;

export type ContactField = keyof ContactLeadInput;

export interface ContactValidationSuccess {
  success: true;
  data: ContactLeadInput;
}

export interface ContactValidationFailure {
  success: false;
  fieldErrors: Partial<Record<ContactField, string[]>>;
}

export type ContactValidationResult =
  | ContactValidationSuccess
  | ContactValidationFailure;

const CONTACT_FIELDS = [
  'fullName',
  'email',
  'phone',
  'service',
  'message',
] as const satisfies readonly ContactField[];

/**
 * Returns a canonical contact object without changing the provided input.
 * The explicit object construction also prevents unknown runtime keys from
 * crossing the shared contract boundary.
 */
export function normalizeContactInput(
  input: ContactLeadInput,
): ContactLeadInput {
  const phone = input.phone?.trim();

  return {
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: phone === '' ? undefined : phone,
    service: input.service.trim(),
    message: input.message.trim(),
  };
}

/**
 * Validates an unknown boundary value and returns only serializable field
 * errors when validation fails. A successful result is normalized before it
 * can be passed to a persistence layer.
 */
export function validateContactInput(
  input: unknown,
): ContactValidationResult {
  const parsed = Contact_Schema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string[]>> = {};

    for (const issue of parsed.error.issues) {
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

    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: normalizeContactInput(parsed.data),
  };
}
