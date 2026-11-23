import type { ContactLead, PrismaClient } from '@prisma/client';
import {
  normalizeContactInput,
  type ContactLeadInput,
} from '../../../shared/validation/contactSchema';

/**
 * Persists one already validated contact using only the canonical input fields.
 * Prisma remains responsible for generating id and createdAt.
 */
export async function createContactLead(
  prisma: PrismaClient,
  input: ContactLeadInput,
): Promise<ContactLead> {
  const normalized = normalizeContactInput(input);

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
