import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { buildWhatsAppUrl, resolvePublicRoute } from './routing';

const PUBLIC_ROUTES = [
  'home',
  'about',
  'services',
  'faq',
  'contact',
  'notFound',
] as const;

const absolutePathnameArbitrary = fc
  .array(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_-.?=&'.split(''),
    ),
    { maxLength: 80 },
  )
  .map((characters) => `/${characters.join('')}`);

describe('resolvePublicRoute', () => {
  it.each([
    ['/', 'home'],
    ['/nosotros', 'about'],
    ['/servicios', 'services'],
    ['/faq', 'faq'],
    ['/contacto', 'contact'],
  ] as const)('resolves %s to %s', (pathname, expectedRoute) => {
    expect(resolvePublicRoute(pathname)).toBe(expectedRoute);
  });

  it.each(['/desconocida', '/nosotros/', '/api', '/api/contact'])(
    'resolves %s as notFound',
    (pathname) => {
      expect(resolvePublicRoute(pathname)).toBe('notFound');
    },
  );

  // **Validates: Requirements 2.1–2.5, 13.7**
  it('resolves every absolute pathname to a known non-API public route', () => {
    fc.assert(
      fc.property(absolutePathnameArbitrary, (pathname) => {
        const resolvedRoute = resolvePublicRoute(pathname);

        expect(resolvedRoute).not.toBeUndefined();
        expect(PUBLIC_ROUTES).toContain(resolvedRoute);
        expect(resolvedRoute).not.toMatch(/^api/);
      }),
      { numRuns: 100 },
    );
  });
});

describe('buildWhatsAppUrl', () => {
  it.each([
    '584162459941',
    '+584162459941',
    '+58 416 245 9941',
    '+58 (416) 245-9941',
    '58.416.245.9941',
  ])('normalizes %s to the canonical URL', (whatsappNumber) => {
    expect(buildWhatsAppUrl(whatsappNumber)).toBe(
      'https://wa.me/584162459941',
    );
  });

  it.each([
    '',
    'abc584162459941',
    '0416 245 9941',
    '123456',
    '+5+84162459941',
    '584162459941/extra',
  ])('rejects invalid configuration %j without exposing the value', (whatsappNumber) => {
    expect(() => buildWhatsAppUrl(whatsappNumber)).toThrow(
      'Invalid WhatsApp number configuration.',
    );
  });
});
