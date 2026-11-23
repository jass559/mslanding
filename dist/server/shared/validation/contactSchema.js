"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactSchema = exports.Contact_Schema = void 0;
exports.normalizeContactInput = normalizeContactInput;
exports.validateContactInput = validateContactInput;
const zod_1 = require("zod");
const optionalPhoneSchema = zod_1.z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value, zod_1.z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+()\d\s.-]+$/)
    .optional());
/**
 * Shared strict contract for contact form submissions.
 *
 * Empty phone values are omitted from the parsed output so persistence layers
 * can map them to NULL, while presentation state keeps phone as a string.
 */
exports.Contact_Schema = zod_1.z
    .object({
    fullName: zod_1.z.string().trim().min(2).max(100),
    email: zod_1.z.string().trim().email().max(254),
    phone: optionalPhoneSchema,
    service: zod_1.z.string().trim().min(1).max(100),
    message: zod_1.z.string().trim().min(10).max(2000),
})
    .strict();
/** Canonical camel-case export used by client and server modules. */
exports.contactSchema = exports.Contact_Schema;
const CONTACT_FIELDS = [
    'fullName',
    'email',
    'phone',
    'service',
    'message',
];
/**
 * Returns a canonical contact object without changing the provided input.
 * The explicit object construction also prevents unknown runtime keys from
 * crossing the shared contract boundary.
 */
function normalizeContactInput(input) {
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
function validateContactInput(input) {
    const parsed = exports.Contact_Schema.safeParse(input);
    if (!parsed.success) {
        const fieldErrors = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[0];
            if (typeof field !== 'string' ||
                !CONTACT_FIELDS.includes(field)) {
                continue;
            }
            const fieldName = field;
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
//# sourceMappingURL=contactSchema.js.map