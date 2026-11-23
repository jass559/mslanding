import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Content_Fixture } from '../../content/contentFixture';
import { Footer } from './Footer';

function renderFooter(): string {
  return renderToString(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('renders the approved company name and footer links in fixture order', () => {
    const markup = renderFooter();

    expect(markup).toContain(Content_Fixture.footer.companyName);

    let previousLinkPosition = -1;
    Content_Fixture.footer.links.forEach((fixtureLink) => {
      const linkPosition = markup.indexOf(`aria-label="${fixtureLink.label}"`);

      expect(markup).toContain(`href="${fixtureLink.href}"`);
      expect(linkPosition).toBeGreaterThan(previousLinkPosition);
      previousLinkPosition = linkPosition;
    });
  });

  it('hides decorative link icons and keeps the footer responsive and focusable', () => {
    const markup = renderFooter();
    const decorativeIconCount = (markup.match(/aria-hidden="true"/g) ?? []).length;

    expect(decorativeIconCount).toBe(Content_Fixture.footer.links.length);
    expect(markup).toContain('aria-label="Enlaces del pie de página"');
    expect(markup).toContain('border-brand-border');
    expect(markup).toContain('bg-brand-surface');
    expect(markup).toContain('flex-col');
    expect(markup).toContain('md:flex-row');
    expect(markup).toContain('focus-visible:outline-brand-accent');
  });
});
