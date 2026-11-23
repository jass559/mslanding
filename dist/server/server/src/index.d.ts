import express, { type Express } from 'express';
export { createContactEndpoint, postContactHandler, } from './routes/contact';
export { createServer, type UnifiedServerOptions, } from './app';
export { apiNotFoundMiddleware, API_NOT_FOUND_RESPONSE, createClientStaticMiddleware, createSpaFallbackMiddleware, isApiPath, } from './middleware/clientDelivery';
export { DEFAULT_CONTACT_RATE_LIMIT, createContactRateLimiter, type ContactRateLimitOptions, } from './middleware/contactRateLimit';
export { JSON_BODY_LIMIT, jsonBodyErrorHandler, jsonBodyMiddleware, } from './middleware/jsonBody';
export { defaultRequestLogger, requestLoggerMiddleware, type RequestLogEntry, type RequestLogger, } from './middleware/requestLogger';
export { REQUEST_ID_HEADER, createRequestId, requestIdMiddleware, } from './middleware/requestId';
export { safeErrorHandler, } from './middleware/safeErrorHandler';
export { securityHeadersMiddleware, type ServerNodeEnvironment, } from './middleware/securityHeaders';
/**
 * Builds the production server and starts the unified API/static listener.
 * Configuration is validated before the Prisma module is loaded so an invalid
 * deployment cannot create a client or expose a partially started server.
 */
export declare function startServer(): Promise<void>;
/** Kept for the initial scaffold and for tests that need an unstarted app. */
export declare function createApp(): Express;
declare const app: express.Express;
export default app;
