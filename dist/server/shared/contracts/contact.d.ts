import type { ContactLeadInput } from '../validation/contactSchema';
export type { ContactLeadInput } from '../validation/contactSchema';
/** Presentation state keeps the optional phone control as a string. */
export interface ContactFormValues {
    fullName: string;
    email: string;
    phone: string;
    service: string;
    message: string;
}
export type ContactFormStatus = 'idle' | 'editing' | 'validating' | 'submitting' | 'validationError' | 'serverError' | 'networkError' | 'success';
export interface ContactFormState {
    status: ContactFormStatus;
    values: ContactFormValues;
    fieldErrors: Partial<Record<keyof ContactFormValues, string[]>>;
    formError?: string;
}
export type ApiErrorCode = 'VALIDATION_ERROR' | 'METHOD_NOT_ALLOWED' | 'RATE_LIMITED' | 'PERSISTENCE_ERROR' | 'INTERNAL_ERROR';
export interface ContactCreatedResponse {
    success: true;
    code: 'CONTACT_CREATED';
}
export interface ApiErrorResponse {
    error: {
        code: ApiErrorCode;
        message: string;
        fields?: Partial<Record<keyof ContactLeadInput, string[]>>;
    };
}
export type ContactApiResponse = ContactCreatedResponse | ApiErrorResponse;
export interface HealthResponse {
    status: 'ok';
}
