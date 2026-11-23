import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { buildWhatsAppUrl } from './routing';

const CANONICAL_WHATSAPP_NUMBER = '584162459941';
const INVALID_CONFIGURATION_MESSAGE = 'Invalid WhatsApp number configuration.';

const formattingCharacterArbitrary = fc.constantFrom(' ', '.', '-', '(', ')');

const formattingGapArbitrary = fc
  .array(formattingCharacterArbitrary, { minLength: 0, maxLength: 3 })
  .map((characters) => characters.join(''));

const validWhatsAppRepresentationArbitrary = fc
  .record({
    includePlus: fc.boolean(),
    gaps: fc.array(formattingGapArbitrary, {
      minLength: CANONICAL_WHATSAPP_NUMBER.length - 1,
      maxLength: CANONICAL_WHATSAPP_NUMBER.length - 1,
    }),
  })
  .map(({ includePlus, gaps }) => {
    const digitsWithFormatting = [...CANONICAL_WHATSAPP_NUMBER]
      .map((digit, index) => `${digit}${gaps[index] ?? ''}`)
      .join('');

    return `${includePlus ? '+' : ''}${digitsWithFormatting}`;
  });

const invalidWhatsAppRepresentationArbitrary = fc.oneof(
  fc.constantFrom(
    '',
    '123456',
    '0416 245 9941',
    '+5+84162459941',
    '584162459941/extra',
  ),
  fc
    .tuple(
      fc.constantFrom('584162459941', '+584162459941'),
      fc.constantFrom('a', '/', '_', ':'),
      fc.integer({ min: 0, max: CANONICAL_WHATSAPP_NUMBER.length }),
    )
    .map(([number, forbiddenCharacter, index]) =>
      `${number.slice(0, index)}${forbiddenCharacter}${number.slice(index)}`,
    ),
);

describe('Property 8: enlace WhatsApp canónico', () => {
  it('normalizes valid formatted representations to the exact canonical URL', () => {
    // **Validates: Requirements 3.4–3.6, 13.8**
    fc.assert(
      fc.property(validWhatsAppRepresentationArbitrary, (representation) => {
        expect(buildWhatsAppUrl(representation)).toBe(
          'https://wa.me/584162459941',
        );
      }),
      { numRuns: 200 },
    );
  });

  it('rejects invalid representations with a configuration error', () => {
    // **Validates: Requirements 3.7, 13.8**
    fc.assert(
      fc.property(invalidWhatsAppRepresentationArbitrary, (representation) => {
        expect(() => buildWhatsAppUrl(representation)).toThrow(
          INVALID_CONFIGURATION_MESSAGE,
        );
      }),
      { numRuns: 200 },
    );
  });
});
