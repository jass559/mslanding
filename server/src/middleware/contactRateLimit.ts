import type { Request, RequestHandler } from 'express';

export interface ContactRateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (request: Request) => string;
}

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

export const DEFAULT_CONTACT_RATE_LIMIT: Required<
  Pick<ContactRateLimitOptions, 'windowMs' | 'maxRequests'>
> = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

function defaultOriginKey(request: Request): string {
  const origin = request.get('Origin')?.trim();

  if (origin) {
    return origin;
  }

  return request.ip || 'unknown-origin';
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}

function isContactSubmission(request: Request): boolean {
  const normalizedPath = request.path.replace(/\/+$/, '') || '/';
  return request.method === 'POST' && normalizedPath === '/api/contact';
}

/**
 * Creates an app-local limiter. A new factory call gets a new counter map,
 * which keeps test applications and server instances isolated from each other.
 */
export function createContactRateLimiter(
  options: ContactRateLimitOptions = {},
): RequestHandler {
  const windowMs = options.windowMs ?? DEFAULT_CONTACT_RATE_LIMIT.windowMs;
  const maxRequests =
    options.maxRequests ?? DEFAULT_CONTACT_RATE_LIMIT.maxRequests;
  const keyGenerator = options.keyGenerator ?? defaultOriginKey;

  assertPositiveInteger(windowMs, 'windowMs');
  assertPositiveInteger(maxRequests, 'maxRequests');

  const windows = new Map<string, RateLimitWindow>();

  return (request, response, next) => {
    if (!isContactSubmission(request)) {
      next();
      return;
    }

    const now = Date.now();
    const key = keyGenerator(request);
    const current = windows.get(key);
    const activeWindow =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + windowMs };

    if (activeWindow.count >= maxRequests) {
      response.setHeader(
        'Retry-After',
        Math.max(1, Math.ceil((activeWindow.resetAt - now) / 1000)),
      );
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many contact requests. Please try again later.',
        },
      });
      return;
    }

    activeWindow.count += 1;
    windows.set(key, activeWindow);
    next();
  };
}
