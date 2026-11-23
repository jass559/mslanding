"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
/**
 * Reports HTTP readiness without depending on Prisma or business data.
 */
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get('/', (_request, response) => {
    response.status(200).json({ status: 'ok' });
});
//# sourceMappingURL=health.js.map