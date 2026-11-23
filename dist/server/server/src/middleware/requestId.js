"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUEST_ID_HEADER = void 0;
exports.createRequestId = createRequestId;
exports.requestIdMiddleware = requestIdMiddleware;
const node_crypto_1 = require("node:crypto");
exports.REQUEST_ID_HEADER = 'X-Request-ID';
const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function isSafeRequestId(value) {
    return value !== undefined && SAFE_REQUEST_ID.test(value);
}
function createRequestId() {
    return (0, node_crypto_1.randomUUID)();
}
/** Adds a bounded, non-sensitive correlation id to every HTTP response. */
function requestIdMiddleware() {
    return (request, response, next) => {
        const providedRequestId = request.get(exports.REQUEST_ID_HEADER);
        const requestId = isSafeRequestId(providedRequestId)
            ? providedRequestId
            : createRequestId();
        request.requestId = requestId;
        response.locals.requestId = requestId;
        response.setHeader(exports.REQUEST_ID_HEADER, requestId);
        next();
    };
}
//# sourceMappingURL=requestId.js.map