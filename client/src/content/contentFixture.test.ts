import { describe, expect, it } from 'vitest';

import {
  CONTENT_SOURCE_STATUS,
  COPY_SOURCE,
  Content_Fixture,
} from './contentFixture';

describe('Content_Fixture', () => {
  it('exports the required source identifier and public navigation', () => {
    expect(COPY_SOURCE).toBe('original-feature-request');
    expect(Content_Fixture.nav.items).toEqual([
      { label: 'Inicio', href: '/' },
      { label: 'Quiénes Somos', href: '/nosotros' },
      { label: 'Servicios', href: '/servicios' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contacto', href: '/contacto' },
    ]);
  });

  it('keeps canonical contact fields and approved WhatsApp configuration', () => {
    expect(Content_Fixture.contact.form.labels).toEqual({
      fullName: 'Nombre completo',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      service: 'Servicio de interés',
      message: 'Mensaje',
    });
    expect(Content_Fixture.contact.form.requiredFields).toEqual([
      'fullName',
      'email',
      'service',
      'message',
    ]);
    expect(Content_Fixture.contact.form.optionalFields).toEqual(['phone']);
    expect(Content_Fixture.contact.corporateData.whatsappUrl).toBe(
      'https://wa.me/584162459941',
    );
  });

  it('keeps API and form status messages in the content source', () => {
    expect(Content_Fixture.messages.api).toEqual({
      contactCreated: 'CONTACT_CREATED',
      validationError: 'VALIDATION_ERROR',
      methodNotAllowed: 'METHOD_NOT_ALLOWED',
      rateLimited: 'RATE_LIMITED',
      persistenceError: 'PERSISTENCE_ERROR',
      internalError: 'INTERNAL_ERROR',
    });
    expect(Content_Fixture.messages.formStates.success).toBe('success');
    expect(CONTENT_SOURCE_STATUS).toMatchObject({
      source: 'original-feature-request',
      approvedPageCopyAvailable: true,
      unavailableBlocks: [],
    });
  });
});
