import { type Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { type ContactRateLimitOptions } from './middleware/contactRateLimit';
import { type RequestLogger } from './middleware/requestLogger';
import { type ServerNodeEnvironment } from './middleware/securityHeaders';
export interface UnifiedServerOptions {
    prisma: PrismaClient;
    clientDistPath: string;
    nodeEnv: ServerNodeEnvironment;
    contactRateLimit?: ContactRateLimitOptions;
    logger?: RequestLogger;
}
/**
 * Builds the unstarted Express application and its middleware in request
 * order: cross-cutting concerns, API handlers, API boundary, static files,
 * SPA fallback, then the final safe error boundary.
 */
export declare function createServer(options: UnifiedServerOptions): Express;
