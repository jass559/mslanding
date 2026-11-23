import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Content_Fixture } from '../../content/contentFixture';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('mounts shared chrome once around routed content and preserves layout spacing', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/servicios']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/servicios"
              element={<p data-testid="route-content">Route content</p>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const shell = container.querySelector('#app-shell');
    const main = container.querySelector('#main-content');
    const routeContent = container.querySelector('[data-testid="route-content"]');
    const whatsappLabel = `${Content_Fixture.contact.corporateData.whatsappLabel} de ${Content_Fixture.contact.corporateData.companyName}`;

    if (!shell || !main || !routeContent) {
      throw new Error('The AppShell route composition was not rendered.');
    }

    expect(
      Array.from(shell.children).map((element) => (element as Element).tagName),
    ).toEqual([
      'HEADER',
      'MAIN',
      'FOOTER',
      'A',
    ]);
    expect(shell.querySelectorAll('header').length).toBe(1);
    expect(shell.querySelectorAll('footer').length).toBe(1);
    expect(shell.querySelectorAll('nav[aria-label="Navegación principal"]').length).toBe(1);
    expect(shell.querySelectorAll(`a[aria-label="${whatsappLabel}"]`).length).toBe(1);
    expect(container.querySelectorAll('[data-testid="route-content"]').length).toBe(1);
    expect(main.contains(routeContent)).toBe(true);
    expect(main.classList.contains('pt-20')).toBe(true);
    expect(main.classList.contains('pb-24')).toBe(true);
  });
});
