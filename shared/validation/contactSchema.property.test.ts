import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { Contact_Schema } from './contactSchema';

const CANONICAL_FIELDS = [
  'fullName',
  'email',
  'phone',
  'service',
  'message',
] as const;

const validContact = {
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '+58 412 459 9941',
  service: 'Instalación',
  message: 'Necesito una cotización para el servicio.',
};

const nonStringJsonValue = fc.oneof(
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.array(fc.jsonValue(), { maxLength: 3 }),
  fc.dictionary(fc.string({ maxLength: 12 }), fc.jsonValue(), {
    maxKeys: 3,
  }),
);

const invalidContactJson = fc.oneof(
  nonStringJsonValue.map((value) => ({ ...validContact, fullName: value })),
  nonStringJsonValue.map((value) => ({ ...validContact, email: value })),
  nonStringJsonValue.map((value) => ({ ...validContact, phone: value })),
  nonStringJsonValue.map((value) => ({ ...validContact, service: value })),
  nonStringJsonValue.map((value) => ({ ...validContact, message: value })),
  fc.integer({ min: 0, max: 1 }).map((length) => ({
    ...validContact,
    fullName: 'A'.repeat(length),
  })),
  fc.integer({ min: 101, max: 120 }).map((length) => ({
    ...validContact,
    fullName: 'A'.repeat(length),
  })),
  fc.integer({ min: 0, max: 80 }).map((length) => ({
    ...validContact,
    email: `${'a'.repeat(255 + length)}@b.co`,
  })),
  fc.string({ maxLength: 80 }).map((value) => ({
    ...validContact,
    email: value.replaceAll('@', '') || 'invalid-email',
  })),
  fc.integer({ min: 1, max: 6 }).map((length) => ({
    ...validContact,
    phone: '1'.repeat(length),
  })),
  fc.integer({ min: 31, max: 40 }).map((length) => ({
    ...validContact,
    phone: '1'.repeat(length),
  })),
  fc.string({ maxLength: 22 }).map((value) => ({
    ...validContact,
    phone: `${value.replace(/[+()\d\s.-]/g, '')}/`,
  })),
  fc.constant({ ...validContact, service: '' }),
  fc.integer({ min: 101, max: 120 }).map((length) => ({
    ...validContact,
    service: 'S'.repeat(length),
  })),
  fc.integer({ min: 0, max: 9 }).map((length) => ({
    ...validContact,
    message: 'M'.repeat(length),
  })),
  fc.integer({ min: 2001, max: 2020 }).map((length) => ({
    ...validContact,
    message: 'M'.repeat(length),
  })),
  fc
    .string({ minLength: 1, maxLength: 20 })
    .filter(
      (key) =>
        key !== '__proto__' &&
        !CANONICAL_FIELDS.includes(key as (typeof CANONICAL_FIELDS)[number]),
    )
    .map((key) => ({ ...validContact, [key]: 'unexpected' })),
);

type PropertyScenario = {
  value: unknown;
  mustReject: boolean;
};

const propertyScenario = fc.oneof(
  fc.jsonValue().map((value): PropertyScenario => ({ value, mustReject: false })),
  invalidContactJson.map(
    (value): PropertyScenario => ({ value, mustReject: true }),
  ),
);

function assertValidParsedContact(data: Record<string, unknown>): void {
  const keys = Object.keys(data);

  expect(keys.every((key) =>
    CANONICAL_FIELDS.includes(key as (typeof CANONICAL_FIELDS)[number]),
  )).toBe(true);
  expect(keys).toEqual(expect.arrayContaining(['fullName', 'email', 'service', 'message']));

  expect(typeof data.fullName).toBe('string');
  expect(data.fullName).toBe((data.fullName as string).trim());
  expect((data.fullName as string).length).toBeGreaterThanOrEqual(2);
  expect((data.fullName as string).length).toBeLessThanOrEqual(100);

  expect(typeof data.email).toBe('string');
  expect(data.email).toBe((data.email as string).trim());
  expect((data.email as string).length).toBeLessThanOrEqual(254);
  expect(data.email).toMatch(/^[^@\s]+@[^@\s]+$/);

  expect(typeof data.service).toBe('string');
  expect(data.service).toBe((data.service as string).trim());
  expect((data.service as string).length).toBeGreaterThanOrEqual(1);
  expect((data.service as string).length).toBeLessThanOrEqual(100);

  expect(typeof data.message).toBe('string');
  expect(data.message).toBe((data.message as string).trim());
  expect((data.message as string).length).toBeGreaterThanOrEqual(10);
  expect((data.message as string).length).toBeLessThanOrEqual(2000);

  if (data.phone !== undefined) {
    expect(typeof data.phone).toBe('string');
    expect(data.phone).toBe((data.phone as string).trim());
    expect((data.phone as string).length).toBeGreaterThanOrEqual(7);
    expect((data.phone as string).length).toBeLessThanOrEqual(30);
    expect(data.phone).toMatch(/^[+()\d\s.-]+$/);
  }
}

describe('Property 1: Contact_Schema strict contract and deterministic validation', () => {
  // **Validates: Requirements 4.3–4.7, 5.1–5.2, 13.1–13.2**
  it('deterministically validates arbitrary JSON and rejects contract violations', () => {
    fc.assert(
      fc.property(propertyScenario, ({ value, mustReject }) => {
        const firstResult = Contact_Schema.safeParse(value);
        const secondResult = Contact_Schema.safeParse(value);

        expect(secondResult).toEqual(firstResult);

        if (mustReject) {
          expect(firstResult.success).toBe(false);
          return;
        }

        if (firstResult.success) {
          assertValidParsedContact(firstResult.data);
        }
      }),
      { numRuns: 200 },
    );
  });
});
