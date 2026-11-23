import { z } from 'zod';

export const DEFAULT_PORT = 3000;

const databaseUrlSchema = z
  .string()
  .trim()
  .min(1, 'DATABASE_URL is required')
  .refine(isPostgresUrl, 'DATABASE_URL must be a PostgreSQL URL');

const normalizedWhatsAppNumberSchema = z
  .string()
  .regex(/^\d{7,15}$/, 'WHATSAPP_NUMBER must contain 7 to 15 digits');

const serverEnvironmentSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  PORT: z.number().int().min(1).max(65535),
  WHATSAPP_NUMBER: normalizedWhatsAppNumberSchema,
});

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

export class ServerConfigurationError extends Error {
  readonly issues: readonly ConfigurationIssue[];

  constructor(issues: readonly ConfigurationIssue[]) {
    super('Invalid server configuration.');
    this.name = 'ServerConfigurationError';
    this.issues = issues;
  }
}

function isPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

function normalizeWhatsAppNumber(value: unknown): string | undefined {
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

function toConfigurationIssues(
  issues: z.ZodIssue[],
): ConfigurationIssue[] {
  return issues.map((issue) => ({
    variable: (issue.path[0] ?? 'DATABASE_URL') as ConfigurationVariable,
    message: issue.message,
  }));
}

/**
 * Reads and validates the environment required by the production server.
 * DATABASE_URL never leaves this server-only module.
 */
export function validateServerConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  // Keep the production startup fallback explicit: Number(process.env.PORT) || 3000.
  const port = Number(environment.PORT) || 3000;
  const parsed = serverEnvironmentSchema.safeParse({
    DATABASE_URL: environment.DATABASE_URL,
    PORT: port,
    WHATSAPP_NUMBER: normalizeWhatsAppNumber(environment.WHATSAPP_NUMBER),
  });

  if (!parsed.success) {
    throw new ServerConfigurationError(
      toConfigurationIssues(parsed.error.issues),
    );
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    port: parsed.data.PORT,
    whatsappNumber: parsed.data.WHATSAPP_NUMBER,
  };
}

/** Alias used by the production entry point before it starts listening. */
export const readServerConfig = validateServerConfig;
