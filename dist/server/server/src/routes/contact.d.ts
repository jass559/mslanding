import type { PrismaClient } from '@prisma/client';
import type { Request, RequestHandler, Response } from 'express';
interface ContactDependencies {
    prisma: PrismaClient;
}
/**
 * Validates and persists one contact request. The response intentionally
 * excludes the Prisma-generated id and createdAt fields.
 */
export declare function postContactHandler(request: Request, response: Response, dependencies: ContactDependencies): Promise<void>;
/**
 * Handles every method at the canonical contact path so unsupported methods
 * receive a JSON response instead of Express's default HTML response.
 */
export declare function createContactEndpoint(prisma: PrismaClient): RequestHandler;
export {};
