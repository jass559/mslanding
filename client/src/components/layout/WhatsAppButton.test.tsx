import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { WhatsAppButton } from './WhatsAppButton';
import { Content_Fixture } from '../../content/contentFixture';

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

function mountButton(props?: ComponentProps<typeof WhatsAppButton>): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<WhatsAppButton {...props} />);
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

describe('WhatsAppButton', () => {
  it('builds the canonical default link with an accessible name and safe new-tab attributes', () => {
    const container = mountButton();
    const button = container.querySelector('a');

    if (!button) {
      throw new Error('The WhatsApp link was not rendered.');
    }

    expect(button.getAttribute('aria-label')).toBe(
      `${Content_Fixture.contact.corporateData.whatsappLabel} de ${Content_Fixture.contact.corporateData.companyName}`,
    );
    expect(button.getAttribute('href')).toBe('https://wa.me/584162459941');
    expect(button.getAttribute('target')).toBe('_blank');
    expect(button.getAttribute('rel')).toBe('noreferrer');
  });

  it('normalizes the validated public number before rendering the destination', () => {
    const container = mountButton({ whatsappNumber: '+58 (416) 245-9941' });
    const button = container.querySelector('a');

    if (!button) {
      throw new Error('The WhatsApp link was not rendered.');
    }

    expect(button.getAttribute('href')).toBe('https://wa.me/584162459941');
  });

  it('keeps mobile-safe spacing for the floating control', () => {
    const container = mountButton();
    const button = container.querySelector('a');

    if (!button) {
      throw new Error('The WhatsApp link was not rendered.');
    }

    expect(button.classList.contains('fixed')).toBe(true);
    expect(button.classList.contains('bottom-6')).toBe(true);
    expect(button.classList.contains('right-4')).toBe(true);
    expect(button.classList.contains('mb-[env(safe-area-inset-bottom)]')).toBe(
      true,
    );
  });
});
