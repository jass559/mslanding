import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Content_Fixture } from '../content/contentFixture';
import { App } from './App';

const routeCases = [
  {
    path: '/',
    getPage: () => screen.getByTestId('home-page'),
  },
  {
    path: '/nosotros',
    getPage: () => screen.getByTestId('about-page'),
  },
  {
    path: '/servicios',
    getPage: () => screen.getByRole('heading', {
      name: Content_Fixture.nav.services,
    }),
  },
  {
    path: '/faq',
    getPage: () => screen.getByRole('heading', {
      name: Content_Fixture.faq.title,
    }),
  },
  {
    path: '/contacto',
    getPage: () => screen.getByTestId('contact-page'),
  },
  {
    path: '/ruta-desconocida',
    getPage: () => screen.getByTestId('not-found-page'),
  },
] as const;

describe('App routing', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it.each(routeCases)('resolves $path to the expected page', ({ path, getPage }) => {
    window.history.replaceState({}, '', path);

    render(<App />);

    expect(getPage()).toBeInTheDocument();
    expect(document.querySelectorAll('#app-shell')).toHaveLength(1);
    expect(document.querySelectorAll('#app-shell > header')).toHaveLength(1);
    expect(document.querySelectorAll('#app-shell > footer')).toHaveLength(1);
  });

  it('navigates between public pages without a full document reload', async () => {
    render(<App />);
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, 'pushState');

    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Navegación principal',
    });

    await user.click(within(primaryNavigation).getByRole('link', {
      name: Content_Fixture.nav.about,
    }));

    expect(pushState).toHaveBeenCalled();
    expect(window.location.pathname).toBe('/nosotros');
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
  });
});
