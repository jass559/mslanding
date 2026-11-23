"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonBodyErrorHandler = exports.jsonBodyMiddleware = exports.JSON_BODY_LIMIT = void 0;
const express_1 = __importDefault(require("express"));
exports.JSON_BODY_LIMIT = '32kb';
exports.jsonBodyMiddleware = express_1.default.json({
    limit: exports.JSON_BODY_LIMIT,
    strict: true,
});
function isBodyParserError(error) {
    if (typeof error !== 'object' || error === null) {
        return false;
    }
    const type = error.type;
    return type === 'entity.too.large' || type === 'entity.parse.failed';
}
/** Converts parser failures into safe JSON without exposing parser internals. */
const jsonBodyErrorHandler = (error, _request, response, next) => {
    if (!isBodyParserError(error)) {
        next(error);
        return;
    }
    if (response.headersSent) {
        next(error);
        return;
    }
    const isTooLarge = error.type === 'entity.too.large';
    response.status(isTooLarge ? 413 : 400).json({
        error: {
            code: 'VALIDATION_ERROR',
            message: isTooLarge ? 'Request body is too large.' : 'Invalid JSON body.',
        },
    });
};
exports.jsonBodyErrorHandler = jsonBodyErrorHandler;
//# sourceMappingURL=jsonBody.js.map