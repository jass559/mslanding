import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer } from '@server/app';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const spaIndex = '<!doctype html><html><body><div id="root"></div></body></html>';
const validContact = {
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '',
  service: 'Mantenimiento general',
  message: 'Necesito una cotización para el mantenimiento de mi oficina.',
};

interface CanonicalContactLead {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  service: string;
  message: string;
  createdAt: Date;
}

interface ContactCreateArgs {
  data: {
    fullName: string;
    email: string;
    phone: string | null;
    service: string;
    message: string;
  };
}

interface PrismaDouble {
  prisma: PrismaClient;
  create: ReturnType<typeof vi.fn>;
  records: CanonicalContactLead[];
}

function createPrismaDouble(options: { failure?: Error } = {}): PrismaDouble {
  const records: CanonicalContactLead[] = [];
  const create = vi.fn(async ({ data }: ContactCreateArgs) => {
    if (options.failure) {
      throw options.failure;
    }

    const record: CanonicalContactLead = {
      id: `lead-${records.length + 1}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      service: data.service,
      message: data.message,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    };

    records.push(record);
    return record;
  });

  const prisma = {
    contactLead: { create },
  } as unknown as PrismaClient;

  return { prisma, create, records };
}

function createTestServer(
  prisma: PrismaClient,
  clientDistPath: string,
  contactRateLimit?: { windowMs: number; maxRequests: number },
) {
  return createServer({
    prisma,
    clientDistPath,
    nodeEnv: 'test',
    contactRateLimit,
    logger: () => undefined,
  });
}

function expectSafePublicBody(body: unknown): void {
  expect(JSON.stringify(body)).not.toMatch(
    /DATABASE_URL|postgresql|Prisma|stack|SQL|password|secret|createdAt|"id"/i,
  );
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectTextFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      contents.push(...(await collectTextFiles(entryPath)));
      continue;
    }

    if (!/\.(?:css|html|js|jsx|map|ts|tsx)$/.test(entry.name)) {
      continue;
    }

    contents.push(await readFile(entryPath, 'utf8'));
  }

  return contents;
}

describe('server and PostgreSQL contract integration', () => {
  let clientDistPath: string;

  beforeAll(async () => {
    clientDistPath = await mkdtemp(path.join(os.tmpdir(), 'mss-contract-'));
    await writeFile(path.join(clientDistPath, 'index.html'), spaIndex);
  });

  afterAll(async () => {
    await rm(clientDistPath, { recursive: true, force: true });
  });

  it('returns the health contract without consulting ContactLead', async () => {
    const { prisma, create } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ status: 'ok' });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates exactly one canonical ContactLead and maps an empty phone to NULL', async () => {
    const { prisma, create, records } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://client.example')
      .send({
        ...validContact,
        fullName: '  Ana Pérez  ',
        email: '  ana@example.com  ',
        service: '  Mantenimiento general  ',
        message: '  Necesito una cotización para el mantenimiento de mi oficina.  ',
      });

    expect(response.status).toBe(201);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({
      success: true,
      code: 'CONTACT_CREATED',
    });
    expectSafePublicBody(response.body);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        phone: null,
        service: 'Mantenimiento general',
        message: 'Necesito una cotización para el mantenimiento de mi oficina.',
      },
    });
    expect(records).toHaveLength(1);
    expect(Object.keys(records[0] ?? {}).sort()).toEqual([
      'createdAt',
      'email',
      'fullName',
      'id',
      'message',
      'phone',
      'service',
    ]);
    expect(records[0]).toMatchObject({
      id: 'lead-1',
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: null,
      service: 'Mantenimiento general',
      message: 'Necesito una cotización para el mantenimiento de mi oficina.',
    });
    expect(records[0]?.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid contact data without creating a ContactLead', async () => {
    const { prisma, create } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app)
      .post('/api/contact')
      .send({
        ...validContact,
        fullName: 'A',
        email: 'not-an-email',
        message: 'short',
      });

    expect(response.status).toBe(400);
    expect(response.type).toBe('application/json');
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toEqual(
      expect.objectContaining({
        fullName: expect.any(Array),
        email: expect.any(Array),
        message: expect.any(Array),
      }),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects unknown fields and omits persistence', async () => {
    const { prisma, create } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app)
      .post('/api/contact')
      .send({ ...validContact, unexpected: 'must be rejected' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(create).not.toHaveBeenCalled();
    expectSafePublicBody(response.body);
  });

  it('returns a safe validation error for malformed JSON', async () => {
    const { prisma, create } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app)
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send('{"fullName":');

    expect(response.status).toBe(400);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON body.',
      },
    });
    expect(create).not.toHaveBeenCalled();
    expectSafePublicBody(response.body);
  });

  it('returns JSON 405 for methods other than POST on /api/contact', async () => {
    const { prisma, create } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app).get('/api/contact');

    expect(response.status).toBe(405);
    expect(response.type).toBe('application/json');
    expect(response.headers.allow).toBe('POST');
    expect(response.body).toEqual({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed.',
      },
    });
    expect(create).not.toHaveBeenCalled();
    expectSafePublicBody(response.body);
  });

  it('returns a JSON body error when the request exceeds the body limit', async () => {
    const { prisma, create } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app)
      .post('/api/contact')
      .send({ ...validContact, message: 'x'.repeat(33_000) });

    expect([400, 413]).toContain(response.status);
    expect(response.type).toBe('application/json');
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(create).not.toHaveBeenCalled();
    expectSafePublicBody(response.body);
  });

  it('maps persistence failures to a safe 500 response', async () => {
    const { prisma, create } = createPrismaDouble({
      failure: new Error(
        'PrismaClientKnownRequestError DATABASE_URL=postgresql://user:secret@example.test/db',
      ),
    });
    const app = createTestServer(prisma, clientDistPath);

    const response = await request(app).post('/api/contact').send(validContact);

    expect(response.status).toBe(500);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({
      error: {
        code: 'PERSISTENCE_ERROR',
        message: 'Unable to create contact.',
      },
    });
    expect(create).toHaveBeenCalledTimes(1);
    expectSafePublicBody(response.body);
  });

  it('limits contact submissions per origin while allowing another origin', async () => {
    const { prisma, create } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath, {
      windowMs: 60_000,
      maxRequests: 1,
    });

    const first = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://one.example')
      .send(validContact);
    const repeated = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://one.example')
      .send(validContact);
    const otherOrigin = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://two.example')
      .send(validContact);

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(429);
    expect(repeated.type).toBe('application/json');
    expect(repeated.body.error.code).toBe('RATE_LIMITED');
    expect(otherOrigin.status).toBe(201);
    expect(create).toHaveBeenCalledTimes(2);
    expectSafePublicBody(repeated.body);
  });

  it('returns JSON 404 for unknown API routes and index.html for non-API routes', async () => {
    const { prisma } = createPrismaDouble();
    const app = createTestServer(prisma, clientDistPath);

    const apiResponse = await request(app).get('/api/unknown-route');
    const spaResponse = await request(app).get('/ruta-publica-desconocida');

    expect(apiResponse.status).toBe(404);
    expect(apiResponse.type).toBe('application/json');
    expect(apiResponse.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'API route not found.',
      },
    });
    expect(apiResponse.text).not.toContain('<!doctype html>');
    expectSafePublicBody(apiResponse.body);

    expect(spaResponse.status).toBe(200);
    expect(spaResponse.type).toBe('text/html');
    expect(spaResponse.text).toBe(spaIndex);
  });

  it('keeps DATABASE_URL out of client sources and any available client bundle', async () => {
    const clientDirectories = [
      path.join(projectRoot, 'client'),
      path.join(projectRoot, 'dist', 'client'),
    ];
    const clientContents: string[] = [];

    for (const directory of clientDirectories) {
      if (await pathExists(directory)) {
        clientContents.push(...(await collectTextFiles(directory)));
      }
    }

    expect(clientContents.length).toBeGreaterThan(0);
    expect(clientContents.join('\n')).not.toContain('DATABASE_URL');
  });
});
