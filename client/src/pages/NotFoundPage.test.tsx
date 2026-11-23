import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Content_Fixture } from '../content/contentFixture';
import { NotFoundPage } from './NotFoundPage';

function renderNotFoundPage(): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(
    <MemoryRouter initialEntries={['/ruta-desconocida']}>
      <NotFoundPage />
    </MemoryRouter>,
  );
  return container;
}

describe('NotFoundPage', () => {
  it('renders a safe 404 view with approved brand context', () => {
    const container = renderNotFoundPage();

    expect(container.querySelector('h1')?.textContent).toBe('404');
    expect(container.textContent).toContain(Content_Fixture.brand);
    expect(container.textContent).not.toMatch(/stack trace|node_modules|database_url|prisma/i);
  });

  it('offers every approved public navigation link in fixture order', () => {
    const container = renderNotFoundPage();
    const navigation = container.querySelector(
      'nav[aria-labelledby="not-found-page-title"]',
    );

    if (!navigation) {
      throw new Error('The public fallback navigation was not rendered.');
    }

    const links = Array.from(navigation.querySelectorAll('a'));

    expect(links.map((link) => link.textContent)).toEqual(
      Content_Fixture.nav.items.map((item) => item.label),
    );

    Content_Fixture.nav.items.forEach((item, index) => {
      const link = links[index];

      if (!link) {
        throw new Error(`Missing public navigation link for ${item.label}.`);
      }

      expect(link.getAttribute('href')).toBe(item.href);
      expect(link.getAttribute('aria-label')).toBe(item.label);
    });
  });

  it('keeps the fallback responsive and keyboard focusable', () => {
    const container = renderNotFoundPage();
    const page = container.querySelector('[data-testid="not-found-page"]');
    const links = page?.querySelectorAll('a') ?? [];

    if (!page) {
      throw new Error('The NotFoundPage container was not rendered.');
    }

    expect(page.className).toContain('w-full');
    expect(page.className).toContain('max-w-4xl');
    expect(page.className).toContain('px-4');
    expect(page.querySelector('.brand-surface-raised')).not.toBeNull();
    expect(Array.from(links).every((link) =>
      link.className.includes('focus-visible:outline-brand-accent'),
    )).toBe(true);
  });
});
