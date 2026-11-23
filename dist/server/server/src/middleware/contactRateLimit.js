"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONTACT_RATE_LIMIT = void 0;
exports.createContactRateLimiter = createContactRateLimiter;
exports.DEFAULT_CONTACT_RATE_LIMIT = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
};
function defaultOriginKey(request) {
    const origin = request.get('Origin')?.trim();
    if (origin) {
        return origin;
    }
    return request.ip || 'unknown-origin';
}
function assertPositiveInteger(value, name) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new RangeError(`${name} must be a positive integer.`);
    }
}
function isContactSubmission(request) {
    const normalizedPath = request.path.replace(/\/+$/, '') || '/';
    return request.method === 'POST' && normalizedPath === '/api/contact';
}
/**
 * Creates an app-local limiter. A new factory call gets a new counter map,
 * which keeps test applications and server instances isolated from each other.
 */
function createContactRateLimiter(options = {}) {
    const windowMs = options.windowMs ?? exports.DEFAULT_CONTACT_RATE_LIMIT.windowMs;
    const maxRequests = options.maxRequests ?? exports.DEFAULT_CONTACT_RATE_LIMIT.maxRequests;
    const keyGenerator = options.keyGenerator ?? defaultOriginKey;
    assertPositiveInteger(windowMs, 'windowMs');
    assertPositiveInteger(maxRequests, 'maxRequests');
    const windows = new Map();
    return (request, response, next) => {
        if (!isContactSubmission(request)) {
            next();
            return;
        }
        const now = Date.now();
        const key = keyGenerator(request);
        const current = windows.get(key);
        const activeWindow = current && current.resetAt > now
            ? current
            : { count: 0, resetAt: now + windowMs };
        if (activeWindow.count >= maxRequests) {
            response.setHeader('Retry-After', Math.max(1, Math.ceil((activeWindow.resetAt - now) / 1000)));
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
//# sourceMappingURL=contactRateLimit.js.map