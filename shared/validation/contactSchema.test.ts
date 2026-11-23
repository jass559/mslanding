import { describe, expect, it } from 'vitest';

import {
  Contact_Schema,
  normalizeContactInput,
  validateContactInput,
  type ContactLeadInput,
} from './contactSchema';

const validInput: ContactLeadInput = {
  fullName: ' Ana Pérez ',
  email: ' ana@example.com ',
  phone: ' +58 412 459 9941 ',
  service: ' Instalación ',
  message: ' Necesito una cotización para el servicio. ',
};

const maxLengthEmail = `${'a'.repeat(64)}@${[
  'b'.repeat(61),
  'c'.repeat(61),
  'd'.repeat(61),
].join('.')}.com`;

const minimumLengthInput: ContactLeadInput = {
  fullName: 'AB',
  email: 'a@b.co',
  phone: '1234567',
  service: 'S',
  message: '1234567890',
};

describe('Contact_Schema', () => {
  it('accepts the exact minimum and maximum lengths for every field', () => {
    expect(Contact_Schema.safeParse(minimumLengthInput).success).toBe(true);
    expect(
      Contact_Schema.safeParse({
        fullName: 'A'.repeat(100),
        email: maxLengthEmail,
        phone: '1'.repeat(30),
        service: 'S'.repeat(100),
        message: 'M'.repeat(2000),
      }).success,
    ).toBe(true);
  });

  it.each([
    ['fullName', 'A'],
    ['fullName', 'A'.repeat(101)],
    ['email', `${maxLengthEmail}x`],
    ['phone', '1'.repeat(6)],
    ['phone', '1'.repeat(31)],
    ['service', ''],
    ['service', 'S'.repeat(101)],
    ['message', 'M'.repeat(9)],
    ['message', 'M'.repeat(2001)],
  ] as const)('rejects %s outside its contract length', (field, value) => {
    expect(
      Contact_Schema.safeParse({
        ...minimumLengthInput,
        [field]: value,
      }).success,
    ).toBe(false);
  });

  it('trims all text fields before returning the parsed contract', () => {
    const result = Contact_Schema.safeParse({
      fullName: '  Ana Pérez  ',
      email: ' ana@example.com ',
      phone: ' +58 412 459 9941 ',
      service: ' Instalación ',
      message: ' Necesito una cotización. ',
    });

    expect(result).toEqual({
      success: true,
      data: {
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        phone: '+58 412 459 9941',
        service: 'Instalación',
        message: 'Necesito una cotización.',
      },
    });
  });

  it.each([undefined, '   '])('treats an absent or empty phone as optional', (phone) => {
    const result = Contact_Schema.safeParse({
      ...minimumLengthInput,
      phone,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
    }
  });

  it('rejects unsupported phone characters and unknown fields', () => {
    const invalidPhone = Contact_Schema.safeParse({
      ...minimumLengthInput,
      phone: '+58/412345678',
    });
    const unknownField = Contact_Schema.safeParse({
      ...minimumLengthInput,
      unexpected: 'value',
    });

    expect(invalidPhone.success).toBe(false);
    expect(unknownField.success).toBe(false);
    if (!unknownField.success) {
      expect(unknownField.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'unrecognized_keys' }),
        ]),
      );
    }
  });
});

describe('normalizeContactInput', () => {
  it('trims every field, omits an empty phone, and returns canonical keys', () => {
    const input: ContactLeadInput = {
      ...validInput,
      phone: '   ',
    };

    const normalized = normalizeContactInput(input);

    expect(normalized).toEqual({
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: undefined,
      service: 'Instalación',
      message: 'Necesito una cotización para el servicio.',
    });
    expect(Object.keys(normalized)).toEqual([
      'fullName',
      'email',
      'phone',
      'service',
      'message',
    ]);
  });

  it('does not mutate the input and is idempotent', () => {
    const input: ContactLeadInput = { ...validInput };
    const original = { ...input };

    const once = normalizeContactInput(input);
    const twice = normalizeContactInput(once);

    expect(input).toEqual(original);
    expect(once).not.toBe(input);
    expect(twice).not.toBe(once);
    expect(twice).toEqual(once);
  });

  it('normalizes an absent phone to an explicit undefined contract value', () => {
    const { phone: _phone, ...withoutPhone } = validInput;

    expect(normalizeContactInput(withoutPhone)).toEqual({
      ...normalizeContactInput(validInput),
      phone: undefined,
    });
  });
});

describe('validateContactInput', () => {
  it('returns normalized data for a valid input without mutating it', () => {
    const input = { ...validInput };
    const result = validateContactInput(input);

    expect(result).toEqual({
      success: true,
      data: normalizeContactInput(validInput),
    });
    expect(input).toEqual(validInput);
  });

  it('returns serializable errors for the exact invalid form fields', () => {
    const result = validateContactInput({
      fullName: ' ',
      email: 'not-an-email',
      phone: 'abc',
      service: '',
      message: 'short',
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error('Expected invalid contact input');
    }

    expect(Object.keys(result.fieldErrors).sort()).toEqual([
      'email',
      'fullName',
      'message',
      'phone',
      'service',
    ]);
    expect(Object.values(result.fieldErrors).every((errors) =>
      errors?.every((message) => typeof message === 'string'),
    )).toBe(true);
    expect('data' in result).toBe(false);
  });

  it('rejects unknown keys without exposing them as persistable data', () => {
    const result = validateContactInput({
      ...validInput,
      unexpected: 'value',
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error('Expected unknown contact field to be rejected');
    }

    expect(result.fieldErrors).toEqual({});
    expect('data' in result).toBe(false);
  });
});
