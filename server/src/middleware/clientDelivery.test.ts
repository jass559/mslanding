import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createServer } from '../app';

const spaIndex = '<!doctype html><html><body><div id="root"></div></body></html>';
const staticAsset = 'console.log("client asset");';

let clientDistPath: string;

function createPrismaDouble(): PrismaClient {
  return {
    contactLead: {
      create: async () => {
        throw new Error('not used by client delivery tests');
      },
    },
  } as unknown as PrismaClient;
}

function createTestServer() {
  return createServer({
    prisma: createPrismaDouble(),
    clientDistPath,
    nodeEnv: 'test',
    logger: () => undefined,
  });
}

describe('unified server client delivery', () => {
  beforeAll(async () => {
    clientDistPath = await mkdtemp(path.join(os.tmpdir(), 'mss-client-'));
    await mkdir(path.join(clientDistPath, 'assets'));
    await writeFile(path.join(clientDistPath, 'index.html'), spaIndex);
    await writeFile(path.join(clientDistPath, 'assets', 'app.js'), staticAsset);
  });

  afterAll(async () => {
    await rm(clientDistPath, { recursive: true, force: true });
  });

  it('returns JSON 404 for unknown API routes instead of index.html', async () => {
    const response = await request(createTestServer()).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'API route not found.',
      },
    });
    expect(response.text).not.toContain(spaIndex);
  });

  it('serves existing files from dist/client', async () => {
    const response = await request(createTestServer()).get('/assets/app.js');

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/javascript');
    expect(response.text).toBe(staticAsset);
  });

  it('serves index.html for a known non-API public route', async () => {
    const response = await request(createTestServer()).get('/contacto');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toBe(spaIndex);
  });
});
