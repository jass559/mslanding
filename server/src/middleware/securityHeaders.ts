import type { RequestHandler } from 'express';

export type ServerNodeEnvironment = 'development' | 'test' | 'production';

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
} as const;

/** Applies response headers that do not depend on an endpoint implementation. */
export function securityHeadersMiddleware(
  nodeEnv: ServerNodeEnvironment,
): RequestHandler {
  return (_request, response, next) => {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      response.setHeader(header, value);
    }

    if (nodeEnv === 'production') {
      response.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }

    next();
  };
}
