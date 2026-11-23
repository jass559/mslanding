import { describe, expect, it, vi } from 'vitest';

import {
  createContactFormState,
  createEditingContactFormState,
  submitContactForm,
  type ContactFormValues,
} from './contactClient';

const validValues: ContactFormValues = {
  fullName: ' Ana Pérez ',
  email: ' ana@example.com ',
  phone: ' +58 412 459 9941 ',
  service: ' Instalación ',
  message: ' Necesito una cotización para el servicio. ',
};

function response(status: number, body: unknown): Response {
  return {
    status,
    json: async () => body,
  } as Response;
}

describe('contact client', () => {
  it('creates idle and editing states with the five presentation values', () => {
    expect(createContactFormState()).toEqual({
      status: 'idle',
      values: {
        fullName: '',
        email: '',
        phone: '',
        service: '',
        message: '',
      },
      fieldErrors: {},
    });
    expect(createEditingContactFormState(validValues)).toEqual({
      status: 'editing',
      values: validValues,
      fieldErrors: {},
    });
  });

  it('validates locally and does not request the API for invalid values', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const values = { ...validValues, fullName: 'A', message: 'short' };

    const state = await submitContactForm(values, fetcher);

    expect(state.status).toBe('validationError');
    expect(state.values).toEqual(values);
    expect(state.fieldErrors.fullName).toBeDefined();
    expect(state.fieldErrors.message).toBeDefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('sends exactly the canonical fields and clears only after confirmed creation', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(201, { success: true, code: 'CONTACT_CREATED' }),
      );
    const states: string[] = [];

    const state = await submitContactForm(validValues, fetcher, {
      onStateChange: (nextState) => states.push(nextState.status),
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(Object.keys(JSON.parse(String(init.body)))).toEqual([
      'fullName',
      'email',
      'phone',
      'service',
      'message',
    ]);
    expect(JSON.parse(String(init.body))).toEqual({
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '+58 412 459 9941',
      service: 'Instalación',
      message: 'Necesito una cotización para el servicio.',
    });
    expect(states).toEqual(['validating', 'submitting', 'success']);
    expect(state).toEqual({
      status: 'success',
      values: {
        fullName: '',
        email: '',
        phone: '',
        service: '',
        message: '',
      },
      fieldErrors: {},
    });
  });

  it('keeps phone as an explicit empty canonical field when it is optional', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(201, { success: true, code: 'CONTACT_CREATED' }),
      );

    await submitContactForm({ ...validValues, phone: '   ' }, fetcher);

    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '',
      service: 'Instalación',
      message: 'Necesito una cotización para el servicio.',
    });
  });

  it.each([400, 405, 429, 500])(
    'keeps values and reports serverError for HTTP %s',
    async (status) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          response(status, {
            error: {
              code: status === 429 ? 'RATE_LIMITED' : 'VALIDATION_ERROR',
              message: 'Retryable server error.',
              fields: status === 400 ? { email: ['Invalid email.'] } : undefined,
            },
          }),
        );

      const state = await submitContactForm(validValues, fetcher);

      expect(state.status).toBe('serverError');
      expect(state.values).toEqual(validValues);
      expect(state).not.toHaveProperty('status', 'success');
      if (status === 400) {
        expect(state.fieldErrors).toEqual({ email: ['Invalid email.'] });
      }
    },
  );

  it('treats a 201 response with any other code as a server error', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(201, { success: true, code: 'OTHER' }));

    const state = await submitContactForm(validValues, fetcher);

    expect(state.status).toBe('serverError');
    expect(state.values).toEqual(validValues);
  });

  it('keeps values and reports networkError for network failures and timeouts', async () => {
    const networkFetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('offline'));
    const networkState = await submitContactForm(validValues, networkFetcher);

    expect(networkState.status).toBe('networkError');
    expect(networkState.values).toEqual(validValues);

    const timeoutFetcher = vi.fn<typeof fetch>().mockImplementation(
      () => new Promise<Response>(() => undefined),
    );
    const timeoutState = await submitContactForm(validValues, timeoutFetcher, {
      timeoutMs: 0,
    });

    expect(timeoutState.status).toBe('networkError');
    expect(timeoutState.values).toEqual(validValues);
  });

  it('does not create simultaneous requests for the same submission', async () => {
    let resolveRequest!: (value: Response) => void;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(pendingRequest);

    const firstSubmission = submitContactForm(validValues, fetcher);
    const secondSubmission = submitContactForm(
      { ...validValues, service: 'Otro servicio' },
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveRequest(response(201, { success: true, code: 'CONTACT_CREATED' }));

    await expect(firstSubmission).resolves.toMatchObject({ status: 'success' });
    await expect(secondSubmission).resolves.toMatchObject({ status: 'success' });
  });
});
