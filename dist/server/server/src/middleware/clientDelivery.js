"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiNotFoundMiddleware = exports.API_NOT_FOUND_RESPONSE = void 0;
exports.isApiPath = isApiPath;
exports.createClientStaticMiddleware = createClientStaticMiddleware;
exports.createSpaFallbackMiddleware = createSpaFallbackMiddleware;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const API_ROOT = '/api';
exports.API_NOT_FOUND_RESPONSE = {
    error: {
        code: 'NOT_FOUND',
        message: 'API route not found.',
    },
};
/** Returns true only for the API namespace, not paths such as `/apiary`. */
function isApiPath(pathname) {
    return pathname === API_ROOT || pathname.startsWith(`${API_ROOT}/`);
}
/**
 * Terminates unmatched API requests before static files or the SPA fallback can
 * handle them as HTML.
 */
const apiNotFoundMiddleware = (request, response, next) => {
    if (!isApiPath(request.path)) {
        next();
        return;
    }
    response.status(404).json(exports.API_NOT_FOUND_RESPONSE);
};
exports.apiNotFoundMiddleware = apiNotFoundMiddleware;
/** Serves only files that exist below the compiled client directory. */
function createClientStaticMiddleware(clientDistPath) {
    return express_1.default.static(node_path_1.default.resolve(clientDistPath), {
        fallthrough: true,
        index: false,
    });
}
/**
 * Resolves non-API GET/HEAD requests through the SPA entry point after the
 * static middleware has had the opportunity to serve a real file.
 */
function createSpaFallbackMiddleware(clientDistPath) {
    const indexPath = node_path_1.default.resolve(clientDistPath, 'index.html');
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
//# sourceMappingURL=clientDelivery.js.map