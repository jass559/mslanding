"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readServerConfig = exports.ServerConfigurationError = exports.DEFAULT_PORT = void 0;
exports.validateServerConfig = validateServerConfig;
const zod_1 = require("zod");
exports.DEFAULT_PORT = 3000;
const databaseUrlSchema = zod_1.z
    .string()
    .trim()
    .min(1, 'DATABASE_URL is required')
    .refine(isPostgresUrl, 'DATABASE_URL must be a PostgreSQL URL');
const normalizedWhatsAppNumberSchema = zod_1.z
    .string()
    .regex(/^\d{7,15}$/, 'WHATSAPP_NUMBER must contain 7 to 15 digits');
const serverEnvironmentSchema = zod_1.z.object({
    DATABASE_URL: databaseUrlSchema,
    PORT: zod_1.z.number().int().min(1).max(65535),
    WHATSAPP_NUMBER: normalizedWhatsAppNumberSchema,
});
class ServerConfigurationError extends Error {
    issues;
    constructor(issues) {
        super('Invalid server configuration.');
        this.name = 'ServerConfigurationError';
        this.issues = issues;
    }
}
exports.ServerConfigurationError = ServerConfigurationError;
function isPostgresUrl(value) {
    try {
        const url = new URL(value);
        return ((url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
            url.hostname.length > 0);
    }
    catch {
        return false;
    }
}
function normalizeWhatsAppNumber(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const formattedValue = value.trim();
    if (formattedValue.length === 0 || !/^[+()\d\s.-]+$/.test(formattedValue)) {
        return undefined;
    }
    const withoutFormatting = formattedValue.replace(/[()\s.-]/g, '');
    const digits = withoutFormatting.startsWith('+')
        ? withoutFormatting.slice(1)
        : withoutFormatting;
    return /^\d{7,15}$/.test(digits) ? digits : undefined;
}
function toConfigurationIssues(issues) {
    return issues.map((issue) => ({
        variable: (issue.path[0] ?? 'DATABASE_URL'),
        message: issue.message,
    }));
}
/**
 * Reads and validates the environment required by the production server.
 * DATABASE_URL never leaves this server-only module.
 */
function validateServerConfig(environment = process.env) {
    // Keep the production startup fallback explicit: Number(process.env.PORT) || 3000.
    const port = Number(environment.PORT) || 3000;
    const parsed = serverEnvironmentSchema.safeParse({
        DATABASE_URL: environment.DATABASE_URL,
        PORT: port,
        WHATSAPP_NUMBER: normalizeWhatsAppNumber(environment.WHATSAPP_NUMBER),
    });
    if (!parsed.success) {
        throw new ServerConfigurationError(toConfigurationIssues(parsed.error.issues));
    }
    return {
        databaseUrl: parsed.data.DATABASE_URL,
        port: parsed.data.PORT,
        whatsappNumber: parsed.data.WHATSAPP_NUMBER,
    };
}
/** Alias used by the production entry point before it starts listening. */
exports.readServerConfig = validateServerConfig;
//# sourceMappingURL=config.js.map