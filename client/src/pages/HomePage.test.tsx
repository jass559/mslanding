import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import {
  Content_Fixture,
  type ContentFixture,
} from '../content/contentFixture';
import { HomePage } from './HomePage';

function renderHomePage(): string {
  return renderToString(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('renders the hero and final CTA from the fixture', () => {
    const home: ContentFixture['home'] = Content_Fixture.home;
    const markup = renderHomePage();

    expect(markup).toContain(home.hero.title);
    expect(markup).toContain(home.hero.eyebrow);

    expect(markup).toContain(`href="${home.hero.cta.href}"`);
    expect(markup).toContain(`href="${home.cta.href}"`);
  });

  it('keeps available blocks in fixture order', () => {
    const home: ContentFixture['home'] = Content_Fixture.home;
    const markup = renderHomePage();
    const expectedBlocks = [
      'hero',
      ...(home.proposition.trim() ? ['proposition'] : []),
      ...(home.benefits.length > 0 ? ['benefits'] : []),
      ...(home.featuredServices.length > 0 ? ['featured-services'] : []),
      ...(home.cta.label.trim() ? ['cta'] : []),
    ];
    const blockPositions = expectedBlocks.map((block) => ({
      block,
      position: markup.indexOf(`data-home-block=\"${block}\"`),
    }));

    expect(blockPositions.every(({ position }) => position > -1)).toBe(true);
    expect(
      blockPositions.map(({ position }) => position),
    ).toEqual([...blockPositions]
      .map(({ position }) => position)
      .sort((first, second) => first - second));
    expect(markup).toContain('data-home-block=\"proposition\"');
    expect(markup).toContain('data-home-block=\"benefits\"');
    expect(markup).toContain('data-home-block=\"featured-services\"');
  });

  it('uses responsive brand surfaces without adding fallback copy', () => {
    const markup = renderHomePage();

    expect(markup).toContain('max-w-7xl');
    expect(markup).toContain('px-4');
    expect(markup).toContain('brand-surface-raised');
    expect(markup).toContain('min-w-0');
    expect(markup).not.toContain('Texto de respaldo');
  });
});
