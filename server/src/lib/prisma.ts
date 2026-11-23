import { PrismaClient } from '@prisma/client';

/**
 * Server-only Prisma client. This module must never be imported by client code.
 */
export const prisma = new PrismaClient();

export default prisma;
