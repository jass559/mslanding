import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';

import { Contact_Schema } from '@shared/validation/contactSchema';

import { postContactHandler } from './contact';

const validContact = {
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '04121234567',
  service: 'Mantenimiento',
  message: 'Necesito una cotización para el servicio.',
} as const;

const rejectedContactBodyArbitrary = fc.oneof(
  fc.constant(null),
  fc.boolean(),
  fc.integer(),
  fc.string(),
  fc.array(fc.jsonValue(), { maxLength: 4 }),
  fc.record({ unexpected: fc.jsonValue() }),
  fc.record({
    fullName: fc.constantFrom('', 'a', 1, null),
    email: fc.jsonValue(),
    phone: fc.jsonValue(),
    service: fc.jsonValue(),
    message: fc.jsonValue(),
  }),
  fc.record({
    fullName: fc.jsonValue(),
    email: fc.constantFrom('', 'not-an-email', '@example.com', 'user@'),
    phone: fc.jsonValue(),
    service: fc.jsonValue(),
    message: fc.jsonValue(),
  }),
  fc.record({
    fullName: fc.jsonValue(),
    email: fc.jsonValue(),
    phone: fc.constantFrom('abc', '123', '+', null),
    service: fc.jsonValue(),
    message: fc.jsonValue(),
  }),
  fc.record({
    fullName: fc.jsonValue(),
    email: fc.jsonValue(),
    phone: fc.jsonValue(),
    service: fc.constantFrom('', ' '),
    message: fc.jsonValue(),
  }),
  fc.record({
    fullName: fc.jsonValue(),
    email: fc.jsonValue(),
    phone: fc.jsonValue(),
    service: fc.jsonValue(),
    message: fc.constantFrom('', 'short', 1, null),
  }),
  fc.jsonValue().map((unexpected) => ({
    ...validContact,
    unexpected,
  })),
);

function createResponse() {
  const state: { statusCode?: number; body?: unknown } = {};
  const response = {
    status: vi.fn().mockImplementation((statusCode: number) => {
      state.statusCode = statusCode;
      return response;
    }),
    json: vi.fn().mockImplementation((body: unknown) => {
      state.body = body;
      return response;
    }),
  } as unknown as Response;

  return { response, state };
}

describe('Property 3: validación antes de persistencia', () => {
  it('rechaza cada body inválido antes de invocar Prisma', async () => {
    // **Validates: Requirements 5.4–5.5, 5.8, 13.4**
    await fc.assert(
      fc.asyncProperty(rejectedContactBodyArbitrary, async (body) => {
        expect(Contact_Schema.safeParse(body).success).toBe(false);

        const create = vi.fn();
        const prisma = {
          contactLead: { create },
        } as unknown as PrismaClient;
        const { response, state } = createResponse();

        await postContactHandler(
          { body } as Request,
          response,
          { prisma },
        );

        expect(state.statusCode).toBe(400);
        expect(state.body).toMatchObject({
          error: { code: 'VALIDATION_ERROR' },
        });
        expect(create).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
