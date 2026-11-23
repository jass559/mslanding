import axe from 'axe-core';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';

import { AppShell } from '../../client/src/components/layout/AppShell';
import { Navbar } from '../../client/src/components/layout/Navbar';
import { WhatsAppButton } from '../../client/src/components/layout/WhatsAppButton';
import { ContactPage } from '../../client/src/pages/ContactPage';
import { FaqAccordion, FaqPage } from '../../client/src/pages/FaqPage';
import { HomePage } from '../../client/src/pages/HomePage';
import { AboutPage } from '../../client/src/pages/AboutPage';
import { Content_Fixture } from '../../client/src/content/contentFixture';
import { ServicesPage } from '../../client/src/pages/ServicesPage';
const globalStyles = readFileSync('client/src/styles/index.css', 'utf8');

const axeTokenStyles = `
  html, body { background-color: #0A0A0A; color: #F8FAFC; }
  .bg-brand-background { background-color: #0A0A0A; }
  .bg-brand-surface { background-color: #171717; }
  .bg-brand-surface-raised { background-color: #1E1E1E; }
  .brand-surface { background-color: #171717; }
  .brand-surface-raised { background-color: #1E1E1E; }
  .text-brand-background { color: #0A0A0A; }
  .text-brand-text-primary { color: #F8FAFC; }
  .text-brand-text-secondary { color: #94A3B8; }
  .text-brand-accent { color: #10B981; }
  .text-brand-cta { color: #F97316; }
  .brand-cta { background-color: #F97316; color: #F8FAFC; }
`;

const pageDefinitions = [
  { name: 'Inicio', element: <HomePage /> },
  { name: 'Quiénes Somos', element: <AboutPage /> },
  { name: 'Servicios', element: <ServicesPage /> },
  { name: 'FAQ', element: <FaqPage /> },
  { name: 'Contacto', element: <ContactPage /> },
] as const;

const viewportDefinitions = [
  { name: 'móvil', width: 375 },
  { name: 'tablet', width: 768 },
  { name: 'escritorio', width: 1440 },
] as const;

function renderPage(element: JSX.Element) {
  return render(
    <MemoryRouter>
      <AppShell>{element}</AppShell>
    </MemoryRouter>,
  );
}

function installAxeTokenStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.dataset.testid = 'axe-token-styles';
  style.textContent = axeTokenStyles;
  document.head.appendChild(style);
  return style;
}

function setViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

function formatAxeViolations(violations: axe.Result['violations']): string {
  return violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes
          .map((node) => node.html)
          .join(' | ')}`,
    )
    .join('\n');
}

beforeEach(() => {
  document.documentElement.lang = 'es';
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => null,
  );
  installAxeTokenStyles();
});

afterEach(() => {
  document.querySelector('[data-testid="axe-token-styles"]')?.remove();
  vi.restoreAllMocks();
  cleanup();
});

describe('auditoría automatizada de accesibilidad y responsive', () => {
  it.each(pageDefinitions)(
    'no encuentra violaciones axe en la página $name y su layout compartido',
    async ({ element }) => {
      const { container } = renderPage(element);
      const results = await axe.run(container, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      });

      expect(formatAxeViolations(results.violations)).toBe('');
    },
  );

  it('verifica el contraste de los tokens visuales mediante axe', async () => {
    const { container } = renderPage(<HomePage />);
    const contrastProbe = document.createElement('div');
    contrastProbe.innerHTML = `
      <p class="text-brand-text-primary bg-brand-background">Título</p>
      <p class="text-brand-text-secondary bg-brand-background">Párrafo</p>
      <p class="text-brand-accent bg-brand-background">Acento</p>
    `;
    container.appendChild(contrastProbe);

    const results = await axe.run(contrastProbe, {
      runOnly: ['color-contrast'],
    });

    expect(formatAxeViolations(results.violations)).toBe('');
  });

  it('asocia labels, aria-describedby y aria-live en el formulario', async () => {
    const user = userEvent.setup();
    renderPage(<ContactPage />);
    const form = screen.getByRole('form', { name: Content_Fixture.contact.form.title });
    const fields = ['fullName', 'email', 'phone', 'service', 'message'] as const;

    for (const field of fields) {
      const control = screen.getByLabelText(Content_Fixture.contact.form.labels[field]);
      expect(control).toHaveAttribute('id', field);
      expect(control).toHaveAttribute('name', field);
    }

    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.email)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.service)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.message)).toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).not.toBeRequired();
    expect(screen.getByLabelText(Content_Fixture.contact.form.labels.phone)).toHaveAttribute(
      'aria-describedby',
      'contact-phone-optional',
    );
    expect(form.querySelector('[aria-live]')).toHaveAttribute('aria-live', 'polite');

    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    await waitFor(() => {
      expect(screen.getByLabelText(Content_Fixture.contact.form.labels.fullName)).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    for (const field of ['fullName', 'email', 'service', 'message'] as const) {
      const control = screen.getByLabelText(Content_Fixture.contact.form.labels[field]);
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(control.getAttribute('aria-describedby')).toContain(
        `contact-${field}-error`,
      );
      expect(
        document.getElementById(`contact-${field}-error`),
      ).toBeInTheDocument();
    }

    const optionalPhone = screen.getByLabelText(Content_Fixture.contact.form.labels.phone);
    expect(optionalPhone).toHaveAttribute('aria-invalid', 'false');
    expect(optionalPhone).toHaveAttribute(
      'aria-describedby',
      'contact-phone-optional',
    );
  });

  it('mantiene foco visible y nombres de iconos seguros en el layout', () => {
    const { container } = renderPage(<HomePage />);
    const controls = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a, button, input, select, textarea, [role="button"]',
      ),
    );

    expect(controls.length).toBeGreaterThan(0);
    controls.forEach((control) => {
      expect(control.className).toMatch(/focus-visible:/);
    });

    const icons = Array.from(container.querySelectorAll('svg'));
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
    });
  });

  it('opera el menú móvil con nombre accesible y conserva los cinco enlaces', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole('button', {
      name: 'Abrir menú de navegación',
    });
    const navigation = screen.getByRole('navigation', {
      name: 'Navegación principal',
    });

    expect(openButton).toHaveAttribute('aria-controls', 'primary-navigation-menu');
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    expect(navigation).toHaveClass('hidden');

    await user.click(openButton);
    expect(openButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(within(navigation).getAllByRole('link')).toHaveLength(5);

    await user.click(within(navigation).getByRole('link', { name: 'Contacto' }));
    expect(screen.getByRole('button', { name: 'Abrir menú de navegación' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opera el acordeón FAQ con teclado y relaciones aria', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 'first', question: '¿Primera pregunta?', answer: 'Primera respuesta.' },
      { id: 'second', question: '¿Segunda pregunta?', answer: 'Segunda respuesta.' },
    ];
    render(
      <MemoryRouter>
        <FaqAccordion items={items} />
      </MemoryRouter>,
    );

    const firstQuestion = screen.getByRole('button', { name: '¿Primera pregunta?' });
    const firstPanel = document.getElementById('faq-answer-0');
    if (!firstPanel) {
      throw new Error('El panel FAQ no fue renderizado.');
    }

    expect(firstQuestion).toHaveAttribute('aria-controls', 'faq-answer-0');
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
    expect(firstPanel).toHaveAttribute('aria-labelledby', 'faq-question-0');
    expect(firstPanel).toHaveAttribute('hidden');

    await user.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    expect(firstPanel).not.toHaveAttribute('hidden');
    expect(firstPanel).toHaveTextContent('Primera respuesta.');

    await user.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
    expect(firstPanel).toHaveAttribute('hidden');
  });

  it('mantiene target y rel seguros en el enlace global de WhatsApp', () => {
    render(
      <MemoryRouter>
        <WhatsAppButton />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', {
      name: `${Content_Fixture.contact.corporateData.whatsappLabel} de ${Content_Fixture.contact.corporateData.companyName}`,
    });
    expect(link).toHaveAttribute('href', 'https://wa.me/584162459941');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('aria-label');
  });

  it.each(viewportDefinitions)(
    'no expone scroll horizontal ni solapa contenido en viewport $name',
    ({ width }) => {
      setViewport(width);

      for (const { element } of pageDefinitions) {
        const { container, unmount } = renderPage(element);
        const shell = container.querySelector('#app-shell');
        const main = container.querySelector('#main-content');
        const whatsapp = container.querySelector<HTMLAnchorElement>(
          `a[aria-label="${Content_Fixture.contact.corporateData.whatsappLabel} de ${Content_Fixture.contact.corporateData.companyName}"]`,
        );

        if (!shell || !main || !whatsapp) {
          throw new Error('El layout compartido no está completo.');
        }

        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
        expect(document.body.scrollWidth).toBeLessThanOrEqual(width);
        expect(shell).toHaveClass('overflow-x-clip');
        expect(main).toHaveClass('pb-24');
        expect(whatsapp).toHaveClass('bottom-6', 'right-4');
        expect(whatsapp).toHaveClass('mb-[env(safe-area-inset-bottom)]');
        unmount();
      }
    },
  );

  it('declara la reducción de movimiento y una separación inferior para el control flotante', () => {
    expect(globalStyles).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(globalStyles).toContain('animation-duration: 0.01ms');
    expect(globalStyles).toContain('transition-duration: 0.01ms');
    expect(globalStyles).toContain('scroll-behavior: auto !important');
    expect(globalStyles).toContain('overflow-x: hidden');

    const { container } = renderPage(<ContactPage />);
    const whatsapp = container.querySelector<HTMLAnchorElement>(
      `a[aria-label="${Content_Fixture.contact.corporateData.whatsappLabel} de ${Content_Fixture.contact.corporateData.companyName}"]`,
    );
    const main = container.querySelector('#main-content');

    if (!whatsapp || !main) {
      throw new Error('El control flotante o el contenido principal no existe.');
    }

    expect(main).toHaveClass('pb-24');
    expect(whatsapp.className).toContain('mb-[env(safe-area-inset-bottom)]');
    expect(whatsapp.className).toContain('bottom-6');
  });
});
