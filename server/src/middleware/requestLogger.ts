import type { RequestHandler } from 'express';

export interface RequestLogEntry {
  method: string;
  route: string;
  status: number;
  durationMs: number;
  requestId: string;
}

export type RequestLogger = (entry: RequestLogEntry) => void;

export const defaultRequestLogger: RequestLogger = (entry) => {
  console.info(entry);
};

function roundDuration(durationMs: number): number {
  return Math.round(durationMs * 100) / 100;
}

/** Logs only request metadata and never reads the request body. */
export function requestLoggerMiddleware(
  logger: RequestLogger = defaultRequestLogger,
): RequestHandler {
  return (request, response, next) => {
    const startedAt = process.hrtime.bigint();
    let hasLogged = false;

    const logRequest = () => {
      if (hasLogged) {
        return;
      }

      hasLogged = true;
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const requestId =
        response.locals.requestId ?? request.requestId ?? 'unknown';

      try {
        logger({
          method: request.method,
          route: request.path,
          status: response.statusCode,
          durationMs: roundDuration(durationMs),
          requestId,
        });
      } catch {
        // Logging must never alter the response or expose an exception.
      }
    };

    response.once('finish', logRequest);
    response.once('close', logRequest);
    next();
  };
}
