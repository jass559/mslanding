import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  Content_Fixture,
  type ContentFixture,
} from '../content/contentFixture';
import { AboutPage } from './AboutPage';

function renderAboutPage(): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(<AboutPage />);
  return container;
}

describe('AboutPage', () => {
  it('renders the page title from the fixture', () => {
    const container = renderAboutPage();

    expect(container.querySelector('h1')?.textContent).toBe(
      Content_Fixture.about.title,
    );
  });

  it('renders available About blocks in fixture order without fallback copy', () => {
    const container = renderAboutPage();
    const blockElements = Array.from(
      container.querySelectorAll<HTMLElement>('[data-about-block]'),
    );
    const values: ContentFixture['about']['values'] =
      Content_Fixture.about.values;
    const expectedBlocks = [
      ...(Content_Fixture.about.identity ? ['identity'] : []),
      ...(Content_Fixture.about.history ? ['history'] : []),
      ...(values.length > 0 ? ['values'] : []),
    ];

    expect(blockElements.map((element) => element.dataset.aboutBlock)).toEqual(
      expectedBlocks,
    );

    if (Content_Fixture.about.identity) {
      expect(container.textContent).toContain(Content_Fixture.about.identity);
    }
    if (Content_Fixture.about.history) {
      expect(container.textContent).toContain(Content_Fixture.about.history);
    }

    values.forEach((value) => {
      expect(container.textContent).toContain(value.title);
      expect(container.textContent).toContain(value.description);
    });
  });

  it('uses responsive surfaces and bounded content without adding horizontal overflow', () => {
    const container = renderAboutPage();
    const page = container.querySelector('[data-testid="about-page"]');
    const content = page?.querySelector('[aria-labelledby="about-page-title"]');

    expect(page?.className).toContain('max-w-7xl');
    expect(page?.className).toContain('px-4');
    expect(content?.className).toContain('min-w-0');
    expect(content?.className).toContain('lg:grid-cols-2');
  });

  it('provides accessible names for rendered content blocks from the fixture', () => {
    const container = renderAboutPage();
    const page = container.querySelector('[data-testid="about-page"]');

    expect(page?.getAttribute('aria-labelledby')).toBe('about-page-title');

    if (Content_Fixture.about.identity) {
      const identity = container.querySelector('[data-about-block="identity"]');

      expect(identity?.getAttribute('aria-labelledby')).toBe(
        'about-identity-copy',
      );
      expect(identity?.querySelector('#about-identity-copy')?.textContent).toBe(
        Content_Fixture.about.identity,
      );
    }

    if (Content_Fixture.about.history) {
      const history = container.querySelector('[data-about-block="history"]');

      expect(history?.getAttribute('aria-labelledby')).toBe(
        'about-history-copy',
      );
      expect(history?.querySelector('#about-history-copy')?.textContent).toBe(
        Content_Fixture.about.history,
      );
    }

    if (Content_Fixture.about.values.length > 0) {
      expect(
        container
          .querySelector('[data-about-block="values"]')
          ?.getAttribute('aria-labelledby'),
      ).toBe('about-page-title');
    }
  });
});
