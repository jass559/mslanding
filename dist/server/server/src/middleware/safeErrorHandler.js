"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeErrorHandler = void 0;
/** Final error boundary that keeps internal errors out of HTTP responses. */
const safeErrorHandler = (_error, _request, response, next) => {
    if (response.headersSent) {
        next(_error);
        return;
    }
    response.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error.',
        },
    });
};
exports.safeErrorHandler = safeErrorHandler;
//# sourceMappingURL=safeErrorHandler.js.map