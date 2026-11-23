import { afterEach, describe, expect, it, vi } from 'vitest';

const prismaModuleState = vi.hoisted(() => ({ loaded: false }));

vi.mock('./lib/prisma', () => {
  prismaModuleState.loaded = true;
  return { default: {} };
});

import { ServerConfigurationError } from './lib/config';
import { startServer } from './index';

const originalEnvironment = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  prismaModuleState.loaded = false;
});

describe('production server entry point', () => {
  it('rejects invalid configuration before loading Prisma or starting the server', async () => {
    process.env.DATABASE_URL = 'https://not-postgresql.example';
    process.env.PORT = '3000';
    process.env.WHATSAPP_NUMBER = '584162459941';

    await expect(startServer()).rejects.toBeInstanceOf(ServerConfigurationError);
    expect(prismaModuleState.loaded).toBe(false);
  });
});
