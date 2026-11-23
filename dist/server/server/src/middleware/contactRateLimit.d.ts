import type { Request, RequestHandler } from 'express';
export interface ContactRateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (request: Request) => string;
}
export declare const DEFAULT_CONTACT_RATE_LIMIT: Required<Pick<ContactRateLimitOptions, 'windowMs' | 'maxRequests'>>;
/**
 * Creates an app-local limiter. A new factory call gets a new counter map,
 * which keeps test applications and server instances isolated from each other.
 */
export declare function createContactRateLimiter(options?: ContactRateLimitOptions): RequestHandler;
