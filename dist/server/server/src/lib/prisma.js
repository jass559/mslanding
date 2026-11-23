"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
/**
 * Server-only Prisma client. This module must never be imported by client code.
 */
exports.prisma = new client_1.PrismaClient();
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map