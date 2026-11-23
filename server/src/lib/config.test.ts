import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PORT,
  readServerConfig,
  ServerConfigurationError,
} from './config';

const validEnvironment: NodeJS.ProcessEnv = {
  DATABASE_URL:
    'postgresql://user:password@localhost:5432/multiservicios_db?schema=public',
  PORT: '3000',
  WHATSAPP_NUMBER: '584162459941',
};

describe('server environment configuration', () => {
  it('reads the required values and normalizes the WhatsApp number', () => {
    const config = readServerConfig({
      ...validEnvironment,
      WHATSAPP_NUMBER: '+58 (416) 245-9941',
    });

    expect(config).toEqual({
      databaseUrl: validEnvironment.DATABASE_URL,
      port: 3000,
      whatsappNumber: '584162459941',
    });
  });

  it('uses port 3000 when PORT is absent or cannot produce a number', () => {
    expect(
      readServerConfig({ ...validEnvironment, PORT: undefined }).port,
    ).toBe(DEFAULT_PORT);
    expect(
      readServerConfig({ ...validEnvironment, PORT: 'not-a-port' }).port,
    ).toBe(DEFAULT_PORT);
  });

  it('rejects a missing or non-PostgreSQL DATABASE_URL without exposing values', () => {
    expect(() =>
      readServerConfig({ ...validEnvironment, DATABASE_URL: undefined }),
    ).toThrow(ServerConfigurationError);
    expect(() =>
      readServerConfig({ ...validEnvironment, DATABASE_URL: 'https://db.example' }),
    ).toThrow(ServerConfigurationError);

    try {
      readServerConfig({
        ...validEnvironment,
        DATABASE_URL: 'https://secret-user:secret-password@db.example/app',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ServerConfigurationError);
      expect((error as Error).message).not.toContain('secret-password');
    }
  });

  it('rejects invalid WhatsApp numbers and out-of-range ports', () => {
    expect(() =>
      readServerConfig({ ...validEnvironment, WHATSAPP_NUMBER: 'invalid' }),
    ).toThrow(ServerConfigurationError);
    expect(() =>
      readServerConfig({ ...validEnvironment, PORT: '65536' }),
    ).toThrow(ServerConfigurationError);
  });
});
