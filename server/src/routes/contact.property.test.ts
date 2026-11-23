import type { ContactLead, PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';

import { Contact_Schema, normalizeContactInput, type ContactLeadInput } from '@shared/validation/contactSchema';

import { postContactHandler } from './contact';

type CanonicalCreateData = Pick<
  ContactLead,
  'fullName' | 'email' | 'phone' | 'service' | 'message'
>;

const whitespace = fc.constantFrom('', ' ', '  ', '\t');
const nameCharacter = fc.constantFrom('A', 'B', 'C', 'D', 'E', 'Á', 'É');
const emailCharacter = fc.constantFrom('a', 'b', 'c', 'd', 'e', '1', '2', '3');
const serviceCharacter = fc.constantFrom('A', 'B', 'C', 'M', 'S', 'é');
const digit = fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9');

const validContactInputArbitrary: fc.Arbitrary<ContactLeadInput> = fc.record({
  fullName: fc
    .tuple(
      whitespace,
      fc.array(nameCharacter, { minLength: 2, maxLength: 40 }),
      whitespace,
    )
    .map(([left, value, right]) => `${left}${value.join('')}${right}`),
  email: fc
    .tuple(
      whitespace,
      fc.array(emailCharacter, { minLength: 1, maxLength: 20 }),
      whitespace,
    )
    .map(([left, value, right]) => `${left}${value.join('')}@example.com${right}`),
  phone: fc.oneof(
    fc.constant(undefined),
    fc.constant('   '),
    fc
      .tuple(
        whitespace,
        fc.array(digit, { minLength: 7, maxLength: 14 }),
        whitespace,
      )
      .map(([left, value, right]) => `${left}${value.join('')}${right}`),
  ),
  service: fc
    .tuple(
      whitespace,
      fc.array(serviceCharacter, { minLength: 1, maxLength: 30 }),
      whitespace,
    )
    .map(([left, value, right]) => `${left}${value.join('')}${right}`),
  message: fc
    .tuple(
      whitespace,
      fc.array(nameCharacter, { minLength: 10, maxLength: 120 }),
      whitespace,
    )
    .map(([left, value, right]) => `${left}${value.join('')}${right}`),
});

function createPrismaDouble() {
  const create = vi.fn<
    (args: { data: CanonicalCreateData }) => Promise<ContactLead>
  >();
  const prisma = {
    contactLead: { create },
  } as unknown as PrismaClient;

  return { create, prisma };
}

function createResponseDouble() {
  let statusCode = 200;
  let publicBody: unknown;
  let response: Response;

  const status = vi.fn((code: number) => {
    statusCode = code;
    return response;
  });
  const json = vi.fn((body: unknown) => {
    publicBody = body;
    return response;
  });

  response = { status, json } as unknown as Response;

  return {
    response,
    status,
    json,
    getStatusCode: () => statusCode,
    getPublicBody: () => publicBody,
  };
}

describe('Property 4: un contacto válido produce un registro canónico', () => {
  // **Validates: Requirements 5.6, 6.1–6.5, 6.7, 13.5, 13.10**
  it('creates exactly one normalized canonical record and exposes only the public success contract', async () => {
    await fc.assert(
      fc.asyncProperty(validContactInputArbitrary, async (input) => {
        const parsed = Contact_Schema.safeParse(input);
        expect(parsed.success).toBe(true);
        if (!parsed.success) {
          throw new Error('The property generator produced an invalid contact input');
        }

        const normalized = normalizeContactInput(parsed.data);
        const { create, prisma } = createPrismaDouble();
        create.mockResolvedValue({
          id: 'cl_property_test',
          fullName: normalized.fullName,
          email: normalized.email,
          phone: normalized.phone ?? null,
          service: normalized.service,
          message: normalized.message,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        });

        const responseDouble = createResponseDouble();
        await postContactHandler(
          { body: input } as Request,
          responseDouble.response,
          { prisma },
        );

        expect(responseDouble.getStatusCode()).toBe(201);
        expect(responseDouble.json).toHaveBeenCalledTimes(1);
        expect(responseDouble.getPublicBody()).toEqual({
          success: true,
          code: 'CONTACT_CREATED',
        });

        const publicBody = responseDouble.getPublicBody();
        expect(publicBody).not.toHaveProperty('name');
        expect(publicBody).not.toHaveProperty('status');
        expect(publicBody).not.toHaveProperty('updatedAt');

        expect(create).toHaveBeenCalledTimes(1);
        const write = create.mock.calls[0]?.[0];
        expect(write).toEqual({
          data: {
            fullName: normalized.fullName,
            email: normalized.email,
            phone: normalized.phone ?? null,
            service: normalized.service,
            message: normalized.message,
          },
        });
        expect(write.data).not.toHaveProperty('name');
        expect(write.data).not.toHaveProperty('status');
        expect(write.data).not.toHaveProperty('updatedAt');
      }),
      { numRuns: 100 },
    );
  });
});
