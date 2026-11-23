"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeadersMiddleware = exports.safeErrorHandler = exports.requestIdMiddleware = exports.createRequestId = exports.REQUEST_ID_HEADER = exports.requestLoggerMiddleware = exports.defaultRequestLogger = exports.jsonBodyMiddleware = exports.jsonBodyErrorHandler = exports.JSON_BODY_LIMIT = exports.createContactRateLimiter = exports.DEFAULT_CONTACT_RATE_LIMIT = exports.isApiPath = exports.createSpaFallbackMiddleware = exports.createClientStaticMiddleware = exports.API_NOT_FOUND_RESPONSE = exports.apiNotFoundMiddleware = exports.createServer = exports.postContactHandler = exports.createContactEndpoint = void 0;
exports.startServer = startServer;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("./lib/config");
var contact_1 = require("./routes/contact");
Object.defineProperty(exports, "createContactEndpoint", { enumerable: true, get: function () { return contact_1.createContactEndpoint; } });
Object.defineProperty(exports, "postContactHandler", { enumerable: true, get: function () { return contact_1.postContactHandler; } });
var app_1 = require("./app");
Object.defineProperty(exports, "createServer", { enumerable: true, get: function () { return app_1.createServer; } });
var clientDelivery_1 = require("./middleware/clientDelivery");
Object.defineProperty(exports, "apiNotFoundMiddleware", { enumerable: true, get: function () { return clientDelivery_1.apiNotFoundMiddleware; } });
Object.defineProperty(exports, "API_NOT_FOUND_RESPONSE", { enumerable: true, get: function () { return clientDelivery_1.API_NOT_FOUND_RESPONSE; } });
Object.defineProperty(exports, "createClientStaticMiddleware", { enumerable: true, get: function () { return clientDelivery_1.createClientStaticMiddleware; } });
Object.defineProperty(exports, "createSpaFallbackMiddleware", { enumerable: true, get: function () { return clientDelivery_1.createSpaFallbackMiddleware; } });
Object.defineProperty(exports, "isApiPath", { enumerable: true, get: function () { return clientDelivery_1.isApiPath; } });
var contactRateLimit_1 = require("./middleware/contactRateLimit");
Object.defineProperty(exports, "DEFAULT_CONTACT_RATE_LIMIT", { enumerable: true, get: function () { return contactRateLimit_1.DEFAULT_CONTACT_RATE_LIMIT; } });
Object.defineProperty(exports, "createContactRateLimiter", { enumerable: true, get: function () { return contactRateLimit_1.createContactRateLimiter; } });
var jsonBody_1 = require("./middleware/jsonBody");
Object.defineProperty(exports, "JSON_BODY_LIMIT", { enumerable: true, get: function () { return jsonBody_1.JSON_BODY_LIMIT; } });
Object.defineProperty(exports, "jsonBodyErrorHandler", { enumerable: true, get: function () { return jsonBody_1.jsonBodyErrorHandler; } });
Object.defineProperty(exports, "jsonBodyMiddleware", { enumerable: true, get: function () { return jsonBody_1.jsonBodyMiddleware; } });
var requestLogger_1 = require("./middleware/requestLogger");
Object.defineProperty(exports, "defaultRequestLogger", { enumerable: true, get: function () { return requestLogger_1.defaultRequestLogger; } });
Object.defineProperty(exports, "requestLoggerMiddleware", { enumerable: true, get: function () { return requestLogger_1.requestLoggerMiddleware; } });
var requestId_1 = require("./middleware/requestId");
Object.defineProperty(exports, "REQUEST_ID_HEADER", { enumerable: true, get: function () { return requestId_1.REQUEST_ID_HEADER; } });
Object.defineProperty(exports, "createRequestId", { enumerable: true, get: function () { return requestId_1.createRequestId; } });
Object.defineProperty(exports, "requestIdMiddleware", { enumerable: true, get: function () { return requestId_1.requestIdMiddleware; } });
var safeErrorHandler_1 = require("./middleware/safeErrorHandler");
Object.defineProperty(exports, "safeErrorHandler", { enumerable: true, get: function () { return safeErrorHandler_1.safeErrorHandler; } });
var securityHeaders_1 = require("./middleware/securityHeaders");
Object.defineProperty(exports, "securityHeadersMiddleware", { enumerable: true, get: function () { return securityHeaders_1.securityHeadersMiddleware; } });
/**
 * Builds the production server and starts the unified API/static listener.
 * Configuration is validated before the Prisma module is loaded so an invalid
 * deployment cannot create a client or expose a partially started server.
 */
async function startServer() {
    (0, config_1.readServerConfig)();
    // This import is intentionally after configuration validation. The module
    // creates the server-only Prisma client as a side effect.
    const { default: prisma } = await Promise.resolve().then(() => __importStar(require('./lib/prisma')));
    const { createServer } = await Promise.resolve().then(() => __importStar(require('./app')));
    const app = createServer({
        prisma,
        clientDistPath: node_path_1.default.resolve(process.cwd(), 'dist/client'),
        nodeEnv: process.env.NODE_ENV === 'production'
            ? 'production'
            : process.env.NODE_ENV === 'test'
                ? 'test'
                : 'development',
    });
    const port = Number(process.env.PORT) || 3000;
    await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            console.info({ port }, 'unified server listening');
            resolve();
        });
        server.once('error', reject);
    });
}
/** Kept for the initial scaffold and for tests that need an unstarted app. */
function createApp() {
    return (0, express_1.default)();
}
const app = createApp();
exports.default = app;
function reportStartupFailure(error) {
    if (error instanceof config_1.ServerConfigurationError) {
        console.error(error.message);
        return;
    }
    console.error('Unable to start the unified server.');
}
if (require.main === module) {
    void startServer().catch((error) => {
        reportStartupFailure(error);
        process.exitCode = 1;
    });
}
//# sourceMappingURL=index.js.map