import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { Content_Fixture } from '../../content/contentFixture';
import { Navbar } from './Navbar';

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

function mountNavbar(initialPath = '/'): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Navbar />
      </MemoryRouter>,
    );
  });

  mountedRoots.push({ container, root });
  return container;
}

afterEach(() => {
  mountedRoots.forEach(({ container, root }) => {
    act(() => root.unmount());
    container.remove();
  });
  mountedRoots.length = 0;
});

describe('Navbar', () => {
  it('renders the fixture navigation in order and exposes a non-color active state', () => {
    const container = mountNavbar('/servicios');
    const navigation = container.querySelector(
      'nav[aria-label="Navegación principal"]',
    );

    if (!navigation) {
      throw new Error('The primary navigation was not rendered.');
    }

    expect(navigation).toHaveClass('md:block');
    expect(navigation.querySelectorAll('a')).toHaveLength(5);

    const links = Array.from(navigation.querySelectorAll('a'));

    expect(links.map((link) => link.textContent)).toEqual(
      Content_Fixture.nav.items.map((item) => item.label),
    );
    Content_Fixture.nav.items.forEach((item) => {
      const link = links.find((candidate) => candidate.textContent === item.label);
      expect(link?.getAttribute('href')).toBe(item.href);
    });

    const activeLink = links.find((link) => link.textContent === 'Servicios');
    expect(activeLink?.getAttribute('aria-current')).toBe('page');
    expect(activeLink?.classList.contains('border-brand-accent')).toBe(true);
    expect(activeLink?.classList.contains('font-semibold')).toBe(true);
  });

  it('provides an accessible mobile toggle and closes after selecting a link', () => {
    const container = mountNavbar();
    const menuButton = container.querySelector('button');
    const navigation = container.querySelector(
      'nav[aria-label="Navegación principal"]',
    );

    if (!menuButton || !navigation) {
      throw new Error('The mobile navigation controls were not rendered.');
    }

    expect(menuButton.getAttribute('aria-controls')).toBe(
      'primary-navigation-menu',
    );
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    expect(navigation.classList.contains('hidden')).toBe(true);
    expect(navigation.classList.contains('md:block')).toBe(true);

    act(() => menuButton.click());

    expect(menuButton.getAttribute('aria-label')).toBe(
      'Cerrar menú de navegación',
    );
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(navigation.classList.contains('block')).toBe(true);
    expect(navigation.querySelectorAll('a')).toHaveLength(5);

    const contactLink = Array.from(navigation.querySelectorAll('a')).find(
      (link) => link.textContent === Content_Fixture.nav.contact,
    );

    if (!contactLink) {
      throw new Error('The contact navigation link was not rendered.');
    }

    act(() => contactLink.click());

    expect(menuButton.getAttribute('aria-label')).toBe(
      'Abrir menú de navegación',
    );
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
  });
});
