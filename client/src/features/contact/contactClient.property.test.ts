import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';

import {
  submitContactForm,
  type ContactFormStatus,
  type ContactFormValues,
} from './contactClient';

function response(status: number, body: unknown): Response {
  return {
    status,
    json: async () => body,
  } as Response;
}

const letters = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const phoneCharacters = [...'0123456789+().-'];
const whitespace = fc.constantFrom('', ' ', '  ');

function textArbitrary(minLength: number, maxLength: number): fc.Arbitrary<string> {
  return fc
    .array(fc.constantFrom(...letters), { minLength, maxLength })
    .map((characters) => characters.join(''));
}

const emailArbitrary = fc
  .tuple(
    textArbitrary(1, 16),
    textArbitrary(1, 12),
    whitespace,
    whitespace,
  )
  .map(([local, domain, leading, trailing]) => `${leading}${local}@${domain}.com${trailing}`);

const phoneArbitrary = fc.oneof(
  fc.constant(''),
  fc
    .tuple(
      fc.array(fc.constantFrom(...phoneCharacters), {
        minLength: 7,
        maxLength: 30,
      }),
      whitespace,
      whitespace,
    )
    .map(([characters, leading, trailing]) =>
      `${leading}${characters.join('')}${trailing}`,
    ),
);

const contactFormValuesArbitrary: fc.Arbitrary<ContactFormValues> = fc.record({
  fullName: fc
    .tuple(textArbitrary(2, 40), whitespace, whitespace)
    .map(([name, leading, trailing]) => `${leading}${name}${trailing}`),
  email: emailArbitrary,
  phone: phoneArbitrary,
  service: fc
    .tuple(textArbitrary(1, 30), whitespace, whitespace)
    .map(([service, leading, trailing]) => `${leading}${service}${trailing}`),
  message: fc
    .tuple(textArbitrary(10, 120), whitespace, whitespace)
    .map(([message, leading, trailing]) => `${leading}${message}${trailing}`),
});

describe('submitContactForm property tests', () => {
  it('preserves all form values and never returns success after an HTTP failure', async () => {
    /** Validates: Requirements 4.10, 4.12–4.13, 11.1–11.2, 11.4–11.5, 13.6 */
    await fc.assert(
      fc.asyncProperty(
        contactFormValuesArbitrary,
        fc.constantFrom(400, 405, 429, 500),
        async (values, status) => {
          const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
            response(status, {
              error: {
                code: status === 429 ? 'RATE_LIMITED' : 'VALIDATION_ERROR',
                message: 'Retryable error.',
              },
            }),
          );
          const observedStatuses: ContactFormStatus[] = [];

          const state = await submitContactForm(values, fetcher, {
            onStateChange: (nextState) => observedStatuses.push(nextState.status),
          });

          expect(fetcher).toHaveBeenCalledTimes(1);
          expect(state.values).toEqual(values);
          expect(state.status).not.toBe('success');
          expect(observedStatuses).not.toContain('success');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('preserves all form values and never returns success after a network failure', async () => {
    /** Validates: Requirements 4.10, 4.12–4.13, 11.1–11.2, 11.4–11.5, 13.6 */
    await fc.assert(
      fc.asyncProperty(contactFormValuesArbitrary, async (values) => {
        const fetcher = vi
          .fn<typeof fetch>()
          .mockRejectedValue(new Error('offline'));
        const observedStatuses: ContactFormStatus[] = [];

        const state = await submitContactForm(values, fetcher, {
          onStateChange: (nextState) => observedStatuses.push(nextState.status),
        });

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(state.values).toEqual(values);
        expect(state.status).not.toBe('success');
        expect(observedStatuses).not.toContain('success');
      }),
      { numRuns: 100 },
    );
  });
});

describe('Property 6: no duplicación durante el envío', () => {
  /** **Validates: Requirements 4.9, 13.6** */
  it('keeps at most one active request across every repeated submit sequence', async () => {
    await fc.assert(
      fc.asyncProperty(
        contactFormValuesArbitrary,
        fc.array(fc.constant('submit' as const), {
          minLength: 1,
          maxLength: 20,
        }),
        async (values, submitSequence) => {
          let activeRequests = 0;
          let maximumActiveRequests = 0;
          const pendingRequests: Array<{ release: () => void }> = [];
          const fetcher = vi.fn<typeof fetch>().mockImplementation(
            () =>
              new Promise<Response>((resolve) => {
                let released = false;
                activeRequests += 1;
                maximumActiveRequests = Math.max(
                  maximumActiveRequests,
                  activeRequests,
                );

                pendingRequests.push({
                  release: () => {
                    if (released) {
                      return;
                    }

                    released = true;
                    activeRequests -= 1;
                    resolve(
                      response(201, {
                        success: true,
                        code: 'CONTACT_CREATED',
                      }),
                    );
                  },
                });
              }),
          );
          const submissions: Array<ReturnType<typeof submitContactForm>> = [];
          const observedStatuses: ContactFormStatus[] = [];

          try {
            submissions.push(
              submitContactForm(values, fetcher, {
                onStateChange: (nextState) =>
                  observedStatuses.push(nextState.status),
              }),
            );

            expect(observedStatuses).toContain('submitting');

            for (const action of submitSequence) {
              expect(action).toBe('submit');
              submissions.push(submitContactForm(values, fetcher));
            }

            expect(maximumActiveRequests).toBeLessThanOrEqual(1);
            expect(activeRequests).toBeLessThanOrEqual(1);
            expect(fetcher).toHaveBeenCalledTimes(1);
          } finally {
            for (const pendingRequest of pendingRequests) {
              pendingRequest.release();
            }

            await Promise.allSettled(submissions);
          }

          const results = await Promise.all(submissions);
          expect(results.every((state) => state.status === 'success')).toBe(true);
          expect(activeRequests).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
