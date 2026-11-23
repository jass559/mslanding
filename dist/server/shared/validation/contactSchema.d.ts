import { z } from 'zod';
/**
 * Shared strict contract for contact form submissions.
 *
 * Empty phone values are omitted from the parsed output so persistence layers
 * can map them to NULL, while presentation state keeps phone as a string.
 */
export declare const Contact_Schema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodPreprocess<z.ZodOptional<z.ZodString>, unknown>;
    service: z.ZodString;
    message: z.ZodString;
}, z.core.$strict>;
/** Canonical camel-case export used by client and server modules. */
export declare const contactSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodPreprocess<z.ZodOptional<z.ZodString>, unknown>;
    service: z.ZodString;
    message: z.ZodString;
}, z.core.$strict>;
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
export type ContactValidationResult = ContactValidationSuccess | ContactValidationFailure;
/**
 * Returns a canonical contact object without changing the provided input.
 * The explicit object construction also prevents unknown runtime keys from
 * crossing the shared contract boundary.
 */
export declare function normalizeContactInput(input: ContactLeadInput): ContactLeadInput;
/**
 * Validates an unknown boundary value and returns only serializable field
 * errors when validation fails. A successful result is normalized before it
 * can be passed to a persistence layer.
 */
export declare function validateContactInput(input: unknown): ContactValidationResult;
