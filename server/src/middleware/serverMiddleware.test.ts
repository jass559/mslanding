import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createServer } from '../app';
import type { RequestLogEntry } from './requestLogger';

function createPrismaDouble(): PrismaClient {
  return {
    contactLead: {
      create: async () => ({
        id: 'cl_middleware_test',
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        phone: null,
        service: 'Mantenimiento',
        message: 'Necesito una cotización para el servicio.',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      }),
    },
  } as unknown as PrismaClient;
}

function createTestServer(
  options: Partial<Parameters<typeof createServer>[0]> = {},
) {
  const logs: RequestLogEntry[] = [];
  const app = createServer({
    prisma: createPrismaDouble(),
    clientDistPath: 'dist/client',
    nodeEnv: 'test',
    logger: (entry) => logs.push(entry),
    ...options,
  });

  return { app, logs };
}

describe('createServer middleware', () => {
  it('injects dependencies without starting a listener and applies security headers', async () => {
    const { app, logs } = createTestServer();
    app.get('/security-check', (_request, response) =>
      response.json({ ok: true }),
    );

    expect(app.locals.clientDistPath).toBe('dist/client');
    expect(app.locals.prisma).toBeDefined();
    expect(app.locals.nodeEnv).toBe('test');

    const response = await request(app)
      .get('/security-check')
      .set('X-Request-ID', 'test-request-1');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('test-request-1');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['permissions-policy']).toContain('camera=()');
    expect(response.headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers['x-powered-by']).toBeUndefined();

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      method: 'GET',
      route: '/security-check',
      status: 200,
      requestId: 'test-request-1',
    });
    expect(logs[0].durationMs).toEqual(expect.any(Number));
  });

  it('logs request metadata without reading or storing sensitive JSON fields', async () => {
    const { app, logs } = createTestServer();
    app.post('/echo', (_request, response) => response.sendStatus(204));

    const sensitiveBody = {
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '+584124599941',
      message: 'Necesito una cotización privada.',
    };

    await request(app).post('/echo').send(sensitiveBody);

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      method: 'POST',
      route: '/echo',
      status: 204,
    });
    expect(JSON.stringify(logs[0])).not.toContain('ana@example.com');
    expect(JSON.stringify(logs[0])).not.toContain('+584124599941');
    expect(JSON.stringify(logs[0])).not.toContain('cotización privada');
  });

  it('returns a safe JSON error when the JSON body exceeds the configured limit', async () => {
    const { app, logs } = createTestServer();
    app.post('/echo', (_request, response) => response.json({ ok: true }));

    const response = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send({ value: 'x'.repeat(33 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body is too large.',
      },
    });
    expect(response.text).not.toContain('stack');
    expect(logs[0]).toMatchObject({ method: 'POST', route: '/echo', status: 413 });
  });

  it('limits POST /api/contact independently for each origin', async () => {
    const { app } = createTestServer({
      contactRateLimit: { windowMs: 60_000, maxRequests: 1 },
    });
    app.post('/api/contact', (_request, response) => response.json({ ok: true }));

    const requestBody = {
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      service: 'Mantenimiento',
      message: 'Necesito una cotización para el servicio.',
    };
    const firstOriginRequest = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://first.example')
      .send(requestBody);
    const secondOriginRequest = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://first.example')
      .send(requestBody);
    const isolatedOriginRequest = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://second.example')
      .send(requestBody);

    expect(firstOriginRequest.status).toBe(201);
    expect(secondOriginRequest.status).toBe(429);
    expect(secondOriginRequest.body).toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many contact requests. Please try again later.',
      },
    });
    expect(secondOriginRequest.headers['retry-after']).toBeDefined();
    expect(isolatedOriginRequest.status).toBe(201);
  });

  it('does not rate limit another path or HTTP method', async () => {
    const { app } = createTestServer({
      contactRateLimit: { windowMs: 60_000, maxRequests: 1 },
    });
    app.post('/other', (_request, response) => response.sendStatus(204));
    app.get('/api/contact', (_request, response) => response.sendStatus(204));

    expect((await request(app).post('/other').send({})).status).toBe(204);
    expect((await request(app).post('/other').send({})).status).toBe(204);
    expect((await request(app).get('/api/contact')).status).toBe(405);
    expect((await request(app).get('/api/contact')).status).toBe(405);
  });
});
