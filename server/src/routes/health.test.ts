import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createServer } from '../app';

function createPrismaMock() {
  const queries = {
    contactCreate: vi.fn(),
    contactFindMany: vi.fn(),
    contactFindFirst: vi.fn(),
    contactCount: vi.fn(),
    queryRaw: vi.fn(),
    executeRaw: vi.fn(),
  };

  const prisma = {
    contactLead: {
      create: queries.contactCreate,
      findMany: queries.contactFindMany,
      findFirst: queries.contactFindFirst,
      count: queries.contactCount,
    },
    $queryRaw: queries.queryRaw,
    $executeRaw: queries.executeRaw,
  } as unknown as PrismaClient;

  return { prisma, queries };
}

describe('GET /api/health', () => {
  it('returns readiness without querying Prisma and before the SPA fallback', async () => {
    const { prisma, queries } = createPrismaMock();
    const app = createServer({
      prisma,
      clientDistPath: 'dist/client',
      nodeEnv: 'test',
      logger: () => undefined,
    });

    app.use((_request, response) => {
      response.type('html').send('<!doctype html><html></html>');
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.type).toBe('application/json');
    expect(queries.contactCreate).not.toHaveBeenCalled();
    expect(queries.contactFindMany).not.toHaveBeenCalled();
    expect(queries.contactFindFirst).not.toHaveBeenCalled();
    expect(queries.contactCount).not.toHaveBeenCalled();
    expect(queries.queryRaw).not.toHaveBeenCalled();
    expect(queries.executeRaw).not.toHaveBeenCalled();
  });
});
