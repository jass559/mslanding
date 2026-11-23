"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeadersMiddleware = securityHeadersMiddleware;
const SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
};
/** Applies response headers that do not depend on an endpoint implementation. */
function securityHeadersMiddleware(nodeEnv) {
    return (_request, response, next) => {
        for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
            response.setHeader(header, value);
        }
        if (nodeEnv === 'production') {
            response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        next();
    };
}
//# sourceMappingURL=securityHeaders.js.map