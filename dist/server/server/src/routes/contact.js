"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postContactHandler = postContactHandler;
exports.createContactEndpoint = createContactEndpoint;
const contactSchema_1 = require("../../../shared/validation/contactSchema");
const contactLead_1 = require("../services/contactLead");
const CONTACT_FIELDS = [
    'fullName',
    'email',
    'phone',
    'service',
    'message',
];
function contactValidationErrors(error) {
    const fields = {};
    for (const issue of error.issues) {
        const field = issue.path[0];
        if (typeof field !== 'string' ||
            !CONTACT_FIELDS.includes(field)) {
            continue;
        }
        const fieldName = field;
        fields[fieldName] = [...(fields[fieldName] ?? []), issue.message];
    }
    return fields;
}
function sendValidationError(response, error) {
    const fields = contactValidationErrors(error);
    const payload = Object.keys(fields).length > 0 ? { fields } : undefined;
    response.status(400).json({
        error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid contact data.',
            ...payload,
        },
    });
}
/**
 * Validates and persists one contact request. The response intentionally
 * excludes the Prisma-generated id and createdAt fields.
 */
async function postContactHandler(request, response, dependencies) {
    const parsed = contactSchema_1.Contact_Schema.safeParse(request.body);
    if (!parsed.success) {
        sendValidationError(response, parsed.error);
        return;
    }
    const normalized = (0, contactSchema_1.normalizeContactInput)(parsed.data);
    try {
        await (0, contactLead_1.createContactLead)(dependencies.prisma, normalized);
    }
    catch {
        response.status(500).json({
            error: {
                code: 'PERSISTENCE_ERROR',
                message: 'Unable to create contact.',
            },
        });
        return;
    }
    response.status(201).json({
        success: true,
        code: 'CONTACT_CREATED',
    });
}
/**
 * Handles every method at the canonical contact path so unsupported methods
 * receive a JSON response instead of Express's default HTML response.
 */
function createContactEndpoint(prisma) {
    return (request, response, next) => {
        if (request.method !== 'POST') {
            response.setHeader('Allow', 'POST');
            response.status(405).json({
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: 'Method not allowed.',
                },
            });
            return;
        }
        void postContactHandler(request, response, { prisma }).catch(next);
    };
}
//# sourceMappingURL=contact.js.map