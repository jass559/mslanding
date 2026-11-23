import type { ContactLead, PrismaClient } from '@prisma/client';
import { type ContactLeadInput } from '../../../shared/validation/contactSchema';
/**
 * Persists one already validated contact using only the canonical input fields.
 * Prisma remains responsible for generating id and createdAt.
 */
export declare function createContactLead(prisma: PrismaClient, input: ContactLeadInput): Promise<ContactLead>;
