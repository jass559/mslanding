import { z } from 'zod';
export declare const DEFAULT_PORT = 3000;
declare const serverEnvironmentSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    PORT: z.ZodNumber;
    WHATSAPP_NUMBER: z.ZodString;
}, z.core.$strip>;
type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
type ConfigurationVariable = keyof ServerEnvironment;
export interface ServerConfig {
    /** Private PostgreSQL connection string. This module is server-only. */
    databaseUrl: string;
    port: number;
    /** Normalized digits used to build the public WhatsApp link. */
    whatsappNumber: string;
}
export interface ConfigurationIssue {
    variable: ConfigurationVariable;
    message: string;
}
export declare class ServerConfigurationError extends Error {
    readonly issues: readonly ConfigurationIssue[];
    constructor(issues: readonly ConfigurationIssue[]);
}
/**
 * Reads and validates the environment required by the production server.
 * DATABASE_URL never leaves this server-only module.
 */
export declare function validateServerConfig(environment?: NodeJS.ProcessEnv): ServerConfig;
/** Alias used by the production entry point before it starts listening. */
export declare const readServerConfig: typeof validateServerConfig;
export {};
