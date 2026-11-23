import { PrismaClient } from '@prisma/client';
/**
 * Server-only Prisma client. This module must never be imported by client code.
 */
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
