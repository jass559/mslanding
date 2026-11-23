import type { PrismaClient } from '@prisma/client';
import fc from 'fast-check';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createServer, type UnifiedServerOptions } from '../app';

const CONTACT_LEAD_OPERATIONS = [
  'create',
  'createMany',
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
] as const;

type ContactLeadOperation = (typeof CONTACT_LEAD_OPERATIONS)[number];
type ContactLeadSpies = Record<ContactLeadOperation, ReturnType<typeof vi.fn>>;

type ReadyServerConfiguration = Pick<
  UnifiedServerOptions,
  'clientDistPath' | 'nodeEnv' | 'contactRateLimit'
>;

const readyServerConfigurationArbitrary: fc.Arbitrary<ReadyServerConfiguration> =
  fc.record({
    nodeEnv: fc.constantFrom('development', 'test', 'production'),
    clientDistPath: fc.constantFrom(
      'dist/client',
      'dist/client-property',
      'dist/client-test',
    ),
    contactRateLimit: fc.record({
      windowMs: fc.integer({ min: 1, max: 60_000 }),
      maxRequests: fc.integer({ min: 1, max: 10 }),
    }),
  });

function createPrismaDouble(): {
  prisma: PrismaClient;
  contactLeadSpies: ContactLeadSpies;
} {
  const contactLeadSpies = Object.fromEntries(
    CONTACT_LEAD_OPERATIONS.map((operation) => [operation, vi.fn()]),
  ) as ContactLeadSpies;

  return {
    prisma: {
      contactLead: contactLeadSpies,
    } as unknown as PrismaClient,
    contactLeadSpies,
  };
}

describe('Property 10: healthcheck aislado', () => {
  // **Validates: Requirements 7.1–7.2, 13.12**
  it('returns exactly the healthy response without touching ContactLead', async () => {
    await fc.assert(
      fc.asyncProperty(
        readyServerConfigurationArbitrary,
        async (configuration) => {
          const { prisma, contactLeadSpies } = createPrismaDouble();
          const app = createServer({
            ...configuration,
            prisma,
            logger: () => undefined,
          });

          const response = await request(app).get('/api/health');

          expect(response.status).toBe(200);
          expect(response.body).toEqual({ status: 'ok' });
          expect(response.type).toBe('application/json');

          for (const operation of CONTACT_LEAD_OPERATIONS) {
            expect(contactLeadSpies[operation]).not.toHaveBeenCalled();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
