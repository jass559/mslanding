import type { ContactLead, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createServer } from '../app';

const validContact = {
  fullName: '  Ana Pérez  ',
  email: ' ana@example.com ',
  phone: '   ',
  service: ' Mantenimiento ',
  message: ' Necesito una cotización para el servicio. ',
};

function createPrismaMock() {
  const create = vi.fn<
    (args: unknown) => Promise<ContactLead>
  >();
  const createdAt = new Date('2025-01-01T00:00:00.000Z');
  const persistedLead: ContactLead = {
    id: 'cl_example',
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    phone: null,
    service: 'Mantenimiento',
    message: 'Necesito una cotización para el servicio.',
    createdAt,
  };
  create.mockResolvedValue(persistedLead);

  const prisma = {
    contactLead: { create },
  } as unknown as PrismaClient;

  return { create, prisma };
}

function createTestServer(
  prisma: PrismaClient,
  options: Partial<Parameters<typeof createServer>[0]> = {},
) {
  return createServer({
    prisma,
    clientDistPath: 'dist/client',
    nodeEnv: 'test',
    logger: () => undefined,
    ...options,
  });
}

describe('POST /api/contact', () => {
  it('validates, normalizes and creates exactly one canonical contact', async () => {
    const { create, prisma } = createPrismaMock();
    const app = createTestServer(prisma);

    const response = await request(app).post('/api/contact').send(validContact);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      code: 'CONTACT_CREATED',
    });
    expect(response.body).not.toHaveProperty('id');
    expect(response.body).not.toHaveProperty('createdAt');
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        phone: null,
        service: 'Mantenimiento',
        message: 'Necesito una cotización para el servicio.',
      },
    });
  });

  it('returns 400 and does not write when fields are invalid', async () => {
    const { create, prisma } = createPrismaMock();
    const app = createTestServer(prisma);

    const response = await request(app).post('/api/contact').send({
      ...validContact,
      fullName: 'A',
      email: 'not-an-email',
      message: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body).not.toHaveProperty('stack');
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 400 and does not write when fields are unknown', async () => {
    const { create, prisma } = createPrismaMock();
    const app = createTestServer(prisma);

    const response = await request(app).post('/api/contact').send({
      ...validContact,
      unexpected: 'must be rejected',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid contact data.',
      },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 400 and does not write when JSON is malformed', async () => {
    const { create, prisma } = createPrismaMock();
    const app = createTestServer(prisma);

    const response = await request(app)
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send('{"fullName":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(create).not.toHaveBeenCalled();
  });

  it('returns a safe persistence error without internal details', async () => {
    const { create, prisma } = createPrismaMock();
    create.mockRejectedValueOnce(
      new Error('Prisma SQL credentials stack trace should stay private'),
    );
    const app = createTestServer(prisma);

    const response = await request(app).post('/api/contact').send(validContact);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'PERSISTENCE_ERROR',
        message: 'Unable to create contact.',
      },
    });
    expect(response.text).not.toContain('Prisma');
    expect(response.text).not.toContain('credentials');
    expect(response.text).not.toContain('stack');
  });

  it('returns JSON 405 for methods other than POST', async () => {
    const { create, prisma } = createPrismaMock();
    const app = createTestServer(prisma);

    const response = await request(app).get('/api/contact');

    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('POST');
    expect(response.body).toEqual({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed.',
      },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 429 after the configured origin limit is exceeded', async () => {
    const { create, prisma } = createPrismaMock();
    const app = createTestServer(prisma, {
      contactRateLimit: { windowMs: 60_000, maxRequests: 1 },
    });

    const first = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://example.test')
      .send(validContact);
    const second = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://example.test')
      .send(validContact);

    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe('RATE_LIMITED');
    expect(second.body.error.message).not.toContain('maxRequests');
    expect(create).toHaveBeenCalledTimes(1);
  });
});
