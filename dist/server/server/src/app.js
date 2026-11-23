"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const clientDelivery_1 = require("./middleware/clientDelivery");
const contactRateLimit_1 = require("./middleware/contactRateLimit");
const jsonBody_1 = require("./middleware/jsonBody");
const requestLogger_1 = require("./middleware/requestLogger");
const requestId_1 = require("./middleware/requestId");
const safeErrorHandler_1 = require("./middleware/safeErrorHandler");
const contact_1 = require("./routes/contact");
const health_1 = require("./routes/health");
const securityHeaders_1 = require("./middleware/securityHeaders");
/**
 * Builds the unstarted Express application and its middleware in request
 * order: cross-cutting concerns, API handlers, API boundary, static files,
 * SPA fallback, then the final safe error boundary.
 */
function createServer(options) {
    const app = (0, express_1.default)();
    app.disable('x-powered-by');
    app.locals.prisma = options.prisma;
    app.locals.clientDistPath = options.clientDistPath;
    app.locals.nodeEnv = options.nodeEnv;
    app.use((0, requestId_1.requestIdMiddleware)());
    app.use((0, securityHeaders_1.securityHeadersMiddleware)(options.nodeEnv));
    app.use((0, requestLogger_1.requestLoggerMiddleware)(options.logger));
    app.use(jsonBody_1.jsonBodyMiddleware);
    app.use(jsonBody_1.jsonBodyErrorHandler);
    app.use((0, contactRateLimit_1.createContactRateLimiter)(options.contactRateLimit));
    // API handlers must finish before the API boundary and client delivery.
    app.use('/api/health', health_1.healthRouter);
    app.all('/api/contact', (0, contact_1.createContactEndpoint)(options.prisma));
    app.use(clientDelivery_1.apiNotFoundMiddleware);
    app.use((0, clientDelivery_1.createClientStaticMiddleware)(options.clientDistPath));
    app.use((0, clientDelivery_1.createSpaFallbackMiddleware)(options.clientDistPath));
    app.use(safeErrorHandler_1.safeErrorHandler);
    return app;
}
//# sourceMappingURL=app.js.map