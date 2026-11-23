import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import {
  Content_Fixture,
  type ServiceContent,
} from '../content/contentFixture';
import { ServicesPage } from './ServicesPage';

describe('ServicesPage', () => {
  it('renders fixture services in order with their exact copy and direct SPA CTA destinations', () => {
    const { getByRole, queryAllByRole } = render(
      <MemoryRouter initialEntries={['/servicios']}>
        <ServicesPage />
      </MemoryRouter>,
    );
    const services: ServiceContent[] = Content_Fixture.services;

    expect(getByRole('heading', { level: 1 }).textContent).toBe(
      Content_Fixture.nav.services,
    );

    const serviceCards = queryAllByRole('article');
    expect(serviceCards).toHaveLength(services.length);

    services.forEach((service, index) => {
      const card = serviceCards[index];

      if (!card) {
        throw new Error(`Service card ${service.id} was not rendered.`);
      }

      expect(card.textContent).toContain(service.title);
      expect(card.textContent).toContain(service.description);

      const cta = card.querySelector('a');
      if (!cta) {
        throw new Error(`CTA for service ${service.id} was not rendered.`);
      }

      expect(cta.textContent).toContain(service.cta);
      expect(cta.getAttribute('href')).toBe(service.ctaHref);
      expect(cta.getAttribute('aria-label')).toBe(service.cta);
    });
  });
});
