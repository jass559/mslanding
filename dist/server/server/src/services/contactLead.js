"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContactLead = createContactLead;
const contactSchema_1 = require("../../../shared/validation/contactSchema");
/**
 * Persists one already validated contact using only the canonical input fields.
 * Prisma remains responsible for generating id and createdAt.
 */
async function createContactLead(prisma, input) {
    const normalized = (0, contactSchema_1.normalizeContactInput)(input);
    const created = await prisma.contactLead.create({
        data: {
            fullName: normalized.fullName,
            email: normalized.email,
            phone: normalized.phone ?? null,
            service: normalized.service,
            message: normalized.message,
        },
    });
    return {
        id: created.id,
        fullName: created.fullName,
        email: created.email,
        phone: created.phone,
        service: created.service,
        message: created.message,
        createdAt: created.createdAt,
    };
}
//# sourceMappingURL=contactLead.js.map