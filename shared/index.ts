export {
  buildWhatsAppUrl,
  resolvePublicRoute,
  type PublicRoute,
  type WhatsAppUrl,
} from './contracts/routing';

export {
  Contact_Schema,
  contactSchema,
  normalizeContactInput,
  validateContactInput,
} from './validation/contactSchema';
export type {
  ContactField,
  ContactLeadInput,
  ContactValidationFailure,
  ContactValidationResult,
  ContactValidationSuccess,
} from './validation/contactSchema';
export type {
  ApiErrorCode,
  ApiErrorResponse,
  ContactApiResponse,
  ContactCreatedResponse,
  ContactFormState,
  ContactFormStatus,
  ContactFormValues,
  HealthResponse,
} from './contracts/contact';