import express, { type Express } from 'express';
import path from 'node:path';

import {
  ServerConfigurationError,
  readServerConfig,
} from './lib/config';

export {
  createContactEndpoint,
  postContactHandler,
} from './routes/contact';
export {
  createServer,
  type UnifiedServerOptions,
} from './app';
export {
  apiNotFoundMiddleware,
  API_NOT_FOUND_RESPONSE,
  createClientStaticMiddleware,
  createSpaFallbackMiddleware,
  isApiPath,
} from './middleware/clientDelivery';
export {
  DEFAULT_CONTACT_RATE_LIMIT,
  createContactRateLimiter,
  type ContactRateLimitOptions,
} from './middleware/contactRateLimit';
export {
  JSON_BODY_LIMIT,
  jsonBodyErrorHandler,
  jsonBodyMiddleware,
} from './middleware/jsonBody';
export {
  defaultRequestLogger,
  requestLoggerMiddleware,
  type RequestLogEntry,
  type RequestLogger,
} from './middleware/requestLogger';
export {
  REQUEST_ID_HEADER,
  createRequestId,
  requestIdMiddleware,
} from './middleware/requestId';
export {
  safeErrorHandler,
} from './middleware/safeErrorHandler';
export {
  securityHeadersMiddleware,
  type ServerNodeEnvironment,
} from './middleware/securityHeaders';

/**
 * Builds the production server and starts the unified API/static listener.
 * Configuration is validated before the Prisma module is loaded so an invalid
 * deployment cannot create a client or expose a partially started server.
 */
export async function startServer(): Promise<void> {
  readServerConfig();

  // This import is intentionally after configuration validation. The module
  // creates the server-only Prisma client as a side effect.
  const { default: prisma } = await import('./lib/prisma');
  const { createServer } = await import('./app');

  const app = createServer({
    prisma,
    clientDistPath: path.resolve(process.cwd(), 'dist/client'),
    nodeEnv:
      process.env.NODE_ENV === 'production'
        ? 'production'
        : process.env.NODE_ENV === 'test'
          ? 'test'
          : 'development',
  });

  const port = Number(process.env.PORT) || 3000;

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, () => {
      console.info({ port }, 'unified server listening');
      resolve();
    });

    server.once('error', reject);
  });
}

/** Kept for the initial scaffold and for tests that need an unstarted app. */
export function createApp(): Express {
  return express();
}

const app = createApp();

export default app;

function reportStartupFailure(error: unknown): void {
  if (error instanceof ServerConfigurationError) {
    console.error(error.message);
    return;
  }

  console.error('Unable to start the unified server.');
}

if (require.main === module) {
  void startServer().catch((error: unknown) => {
    reportStartupFailure(error);
    process.exitCode = 1;
  });
}
