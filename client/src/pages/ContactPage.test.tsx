import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { Content_Fixture } from '../content/contentFixture';
import { ContactPage } from './ContactPage';

function response(status: number, body: unknown): Response {
  return {
    status,
    json: async () => body,
  } as Response;
}

function renderPage(
  props: Parameters<typeof ContactPage>[0] = {},
): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <ContactPage {...props} />
    </MemoryRouter>,
  );
}

describe('ContactPage', () => {
  it('renders Contact_Fixture content and page blocks in fixture order', () => {
    const { container } = renderPage();
    const contact = Content_Fixture.contact;

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      contact.title,
    );
    if (contact.description) {
      expect(screen.getByText(contact.description)).toBeInTheDocument();
    }

    expect(screen.getByText(contact.corporateData.companyName)).toBeInTheDocument();
    const corporateWhatsapp = screen.getByText(
      contact.corporateData.whatsappDisplay,
    );
    expect(corporateWhatsapp).toHaveAttribute(
      'href',
      contact.corporateData.whatsappUrl,
    );

    const ctaLink = container.querySelector(
      '[data-contact-block="whatsapp-cta"] a',
    );
    expect(ctaLink).toHaveTextContent(contact.whatsappCta.label);
    expect(ctaLink).toHaveAttribute('href', contact.whatsappCta.href);

    const channelLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>(
        '[data-contact-block="channels"] a',
      ),
    );
    expect(channelLinks.map((link) => link.textContent?.trim())).toEqual(
      contact.channels.map((channel) => channel.label),
    );
    channelLinks.forEach((link, index) => {
      expect(link).toHaveAttribute('href', contact.channels[index]?.href);
    });

    expect(screen.getByRole('form', { name: Content_Fixture.contact.form.title })).toBeInTheDocument();
    expect(
      ['fullName', 'email', 'phone', 'service', 'message'].map((field) =>
        screen.getByLabelText(
          Content_Fixture.contact.form.labels[
            field as keyof typeof Content_Fixture.contact.form.labels
          ],
        ),
      ),
    ).toHaveLength(5);

    const blocks = Array.from(
      container.querySelectorAll<HTMLElement>('[data-contact-block]'),
    );
    expect(blocks.map((block) => block.dataset.contactBlock)).toEqual([
      'corporate-data',
      'channels',
      'whatsapp-cta',
      'form',
    ]);
  });

  it('clears all five controls only after the client confirms success', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(201, { success: true, code: 'CONTACT_CREATED' }),
      );
    const initialValues = {
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '+58 412 459 9941',
      service: 'Instalación',
      message: 'Necesito una cotización para el servicio.',
    };

    renderPage({ fetcher, initialValues });
    const form = screen.getByRole('form', { name: Content_Fixture.contact.form.title });

    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveValue(initialValues.fullName);
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(Content_Fixture.contact.form.successMessage)).toBeInTheDocument();
    });

    for (const field of ['fullName', 'email', 'phone', 'service', 'message']) {
      expect(screen.getByLabelText(
          Content_Fixture.contact.form.labels[
            field as keyof typeof Content_Fixture.contact.form.labels
          ],
        )).toHaveValue('');
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('preserves all five controls when the client returns an error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response(500, {
        error: {
          code: 'PERSISTENCE_ERROR',
          message: 'No se pudo guardar la solicitud. Intenta de nuevo.',
        },
      }),
    );
    const initialValues = {
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '+58 412 459 9941',
      service: 'Instalación',
      message: 'Necesito una cotización para el servicio.',
    };

    renderPage({ fetcher, initialValues });
    fireEvent.submit(screen.getByRole('form', { name: Content_Fixture.contact.form.title }));

    await waitFor(() => {
      expect(
        screen.getByText('No se pudo guardar la solicitud. Intenta de nuevo.'),
      ).toBeInTheDocument();
    });

    for (const field of ['fullName', 'email', 'phone', 'service', 'message']) {
      expect(screen.getByLabelText(
          Content_Fixture.contact.form.labels[
            field as keyof typeof Content_Fixture.contact.form.labels
          ],
        )).toHaveValue(
        initialValues[field as keyof typeof initialValues],
      );
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
