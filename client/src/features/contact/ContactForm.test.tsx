import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Content_Fixture } from '../../content/contentFixture';
import { ContactForm, type ContactFormProps } from './ContactForm';
import type { ContactFormValues } from './contactClient';

const validValues: ContactFormValues = {
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '+58 412 459 9941',
  service: 'Instalación',
  message: 'Necesito una cotización para el servicio.',
};

function response(status: number, body: unknown): Response {
  return {
    status,
    json: async () => body,
  } as Response;
}

function renderForm(props: ContactFormProps = {}) {
  return render(<ContactForm {...props} />);
}

describe('ContactForm', () => {
  it('renders only the five canonical controls with labels and required states', () => {
    renderForm();

    const fields = ['fullName', 'email', 'phone', 'service', 'message'] as const;
    expect(
      fields.map((field) =>
        screen.getByLabelText(Content_Fixture.contact.form.labels[field]).getAttribute('id'),
      ),    ).toEqual(fields);
    expect(document.querySelectorAll('input, textarea')).toHaveLength(5);
    fields.forEach((field) => {
      expect(screen.getByLabelText(
        Content_Fixture.contact.form.labels[
          field as keyof typeof Content_Fixture.contact.form.labels
        ],
      )).toHaveClass(
        'focus-visible:outline-brand-accent',
      );
    });

    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).not.toBeRequired();
    expect(screen.getByText('(opcional)')).toBeVisible();
  });

  it('shows field errors, associates them and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    renderForm({
      initialValues: {
        ...validValues,
        fullName: 'A',
        email: 'not-an-email',
        phone: '123',
        service: '',
        message: 'short',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    await waitFor(() => {
      expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveFocus();
    });

    for (const field of ['fullName', 'email', 'phone', 'service', 'message']) {
      const control = screen.getByLabelText(
        Content_Fixture.contact.form.labels[
          field as keyof typeof Content_Fixture.contact.form.labels
        ],
      );
      const describedBy = control.getAttribute('aria-describedby');
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(describedBy).toContain(`contact-${field}-error`);
      expect(document.getElementById(`contact-${field}-error`)).toBeInTheDocument();
      expect(document.getElementById(`contact-${field}-error`)).toHaveTextContent(
        /.+/,
      );
    }

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Revisa los errores indicados e inténtalo de nuevo.',
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue('A');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveValue('not-an-email');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).toHaveValue('123');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toHaveValue('');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toHaveValue('short');
  });

  it('disables submit during the request and clears values only after confirmed success', async () => {
    let resolveRequest!: (value: Response) => void;
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(pendingRequest);
    renderForm({ fetcher, initialValues: validValues });

    const form = screen.getByRole('form', { name: Content_Fixture.contact.form.title });
    const submit = screen.getByRole('button', { name: 'Enviar solicitud' });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(submit).toBeDisabled();
      expect(screen.getByText('Enviando tu solicitud…')).toBeInTheDocument();
    });

    fireEvent.submit(form);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue(validValues.fullName);

    resolveRequest(response(201, { success: true, code: 'CONTACT_CREATED' }));

    await waitFor(() => {
      expect(screen.getByText(Content_Fixture.contact.form.successMessage)).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent(
      Content_Fixture.contact.form.successMessage,
    );
    expect(submit).not.toBeDisabled();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue('');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveValue('');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).toHaveValue('');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toHaveValue('');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toHaveValue('');
  });

  it('shows a retryable server error and preserves every value', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(500, {
          error: {
            code: 'PERSISTENCE_ERROR',
            message: 'No se pudo guardar la solicitud. Intenta de nuevo.',
          },
        }),
      );
    renderForm({ fetcher, initialValues: validValues });

    fireEvent.submit(screen.getByRole('form', { name: Content_Fixture.contact.form.title }));

    await waitFor(() => {
      expect(
        screen.getByText('No se pudo guardar la solicitud. Intenta de nuevo.'),
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue(validValues.fullName);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveValue(validValues.email);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).toHaveValue(validValues.phone);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toHaveValue(validValues.service);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toHaveValue(validValues.message);
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).not.toBeDisabled();
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders field errors returned by HTTP 400 and focuses the first returned field', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Revisa los datos enviados.',
          fields: { email: ['El correo no es válido.'] },
        },
      }),
    );
    renderForm({ fetcher, initialValues: validValues });

    fireEvent.submit(screen.getByRole('form', { name: Content_Fixture.contact.form.title }));

    await waitFor(() => {
      expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveFocus();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Revisa los datos enviados.',
    );
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveAttribute(
      'aria-describedby',
      'contact-email-error',
    );
    expect(screen.getByText('El correo no es válido.')).toBeInTheDocument();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue(validValues.fullName);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveValue(validValues.email);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).toHaveValue(validValues.phone);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toHaveValue(validValues.service);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toHaveValue(validValues.message);
  });

  it('shows the retryable rate-limit message and preserves values after HTTP 429', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response(429, {
        error: {
          code: 'RATE_LIMITED',
          message: 'No se pudo enviar la solicitud en este momento. Intenta de nuevo más tarde.',
        },
      }),
    );
    renderForm({ fetcher, initialValues: validValues });

    fireEvent.submit(screen.getByRole('form', { name: Content_Fixture.contact.form.title }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'No se pudo enviar la solicitud en este momento. Intenta de nuevo más tarde.',
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue(validValues.fullName);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveValue(validValues.email);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).toHaveValue(validValues.phone);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toHaveValue(validValues.service);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toHaveValue(validValues.message);
  });

  it('shows a retryable network error and preserves values after a connection failure', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    renderForm({ fetcher, initialValues: validValues });

    fireEvent.submit(screen.getByRole('form', { name: Content_Fixture.contact.form.title }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue(validValues.fullName);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toHaveValue(validValues.email);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).toHaveValue(validValues.phone);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toHaveValue(validValues.service);
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toHaveValue(validValues.message);
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).not.toBeDisabled();
  });
});
