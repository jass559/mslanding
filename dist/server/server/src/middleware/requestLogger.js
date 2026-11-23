"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRequestLogger = void 0;
exports.requestLoggerMiddleware = requestLoggerMiddleware;
const defaultRequestLogger = (entry) => {
    console.info(entry);
};
exports.defaultRequestLogger = defaultRequestLogger;
function roundDuration(durationMs) {
    return Math.round(durationMs * 100) / 100;
}
/** Logs only request metadata and never reads the request body. */
function requestLoggerMiddleware(logger = exports.defaultRequestLogger) {
    return (request, response, next) => {
        const startedAt = process.hrtime.bigint();
        let hasLogged = false;
        const logRequest = () => {
            if (hasLogged) {
                return;
            }
            hasLogged = true;
            const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
            const requestId = response.locals.requestId ?? request.requestId ?? 'unknown';
            try {
                logger({
                    method: request.method,
                    route: request.path,
                    status: response.statusCode,
                    durationMs: roundDuration(durationMs),
                    requestId,
                });
            }
            catch {
                // Logging must never alter the response or expose an exception.
            }
        };
        response.once('finish', logRequest);
        response.once('close', logRequest);
        next();
    };
}
//# sourceMappingURL=requestLogger.js.map