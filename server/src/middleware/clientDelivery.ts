import express, { type RequestHandler } from 'express';
import path from 'node:path';

const API_ROOT = '/api';

export const API_NOT_FOUND_RESPONSE = {
  error: {
    code: 'NOT_FOUND',
    message: 'API route not found.',
  },
} as const;

/** Returns true only for the API namespace, not paths such as `/apiary`. */
export function isApiPath(pathname: string): boolean {
  return pathname === API_ROOT || pathname.startsWith(`${API_ROOT}/`);
}

/**
 * Terminates unmatched API requests before static files or the SPA fallback can
 * handle them as HTML.
 */
export const apiNotFoundMiddleware: RequestHandler = (
  request,
  response,
  next,
) => {
  if (!isApiPath(request.path)) {
    next();
    return;
  }

  response.status(404).json(API_NOT_FOUND_RESPONSE);
};

/** Serves only files that exist below the compiled client directory. */
export function createClientStaticMiddleware(
  clientDistPath: string,
): RequestHandler {
  return express.static(path.resolve(clientDistPath), {
    fallthrough: true,
    index: false,
  });
}

/**
 * Resolves non-API GET/HEAD requests through the SPA entry point after the
 * static middleware has had the opportunity to serve a real file.
 */
export function createSpaFallbackMiddleware(
  clientDistPath: string,
): RequestHandler {
  const indexPath = path.resolve(clientDistPath, 'index.html');

  return (request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      next();
      return;
    }

    response.sendFile(indexPath, (error) => {
      if (error) {
        next(error);
      }
    });
  };
}
