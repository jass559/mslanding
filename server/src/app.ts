import express, { type Express } from 'express';
import type { PrismaClient } from '@prisma/client';

import {
  apiNotFoundMiddleware,
  createClientStaticMiddleware,
  createSpaFallbackMiddleware,
} from './middleware/clientDelivery';
import {
  createContactRateLimiter,
  type ContactRateLimitOptions,
} from './middleware/contactRateLimit';
import {
  jsonBodyErrorHandler,
  jsonBodyMiddleware,
} from './middleware/jsonBody';
import {
  requestLoggerMiddleware,
  type RequestLogger,
} from './middleware/requestLogger';
import { requestIdMiddleware } from './middleware/requestId';
import { safeErrorHandler } from './middleware/safeErrorHandler';
import { createContactEndpoint } from './routes/contact';
import { healthRouter } from './routes/health';
import {
  securityHeadersMiddleware,
  type ServerNodeEnvironment,
} from './middleware/securityHeaders';

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
export function createServer(options: UnifiedServerOptions): Express {
  const app = express();

  app.disable('x-powered-by');
  app.locals.prisma = options.prisma;
  app.locals.clientDistPath = options.clientDistPath;
  app.locals.nodeEnv = options.nodeEnv;

  app.use(requestIdMiddleware());
  app.use(securityHeadersMiddleware(options.nodeEnv));
  app.use(requestLoggerMiddleware(options.logger));
  app.use(jsonBodyMiddleware);
  app.use(jsonBodyErrorHandler);
  app.use(createContactRateLimiter(options.contactRateLimit));

  // API handlers must finish before the API boundary and client delivery.
  app.use('/api/health', healthRouter);
  app.all('/api/contact', createContactEndpoint(options.prisma));
  app.use(apiNotFoundMiddleware);
  app.use(createClientStaticMiddleware(options.clientDistPath));
  app.use(createSpaFallbackMiddleware(options.clientDistPath));
  app.use(safeErrorHandler);

  return app;
}
