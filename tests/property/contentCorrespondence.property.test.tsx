import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ReactElement } from 'react';

import { AppShell } from '../../client/src/components/layout/AppShell';
import { Content_Fixture } from '../../client/src/content/contentFixture';
import { AboutPage } from '../../client/src/pages/AboutPage';
import { ContactPage } from '../../client/src/pages/ContactPage';
import { FaqPage } from '../../client/src/pages/FaqPage';
import { HomePage } from '../../client/src/pages/HomePage';
import { ServicesPage } from '../../client/src/pages/ServicesPage';

type PublicPage = 'home' | 'about' | 'services' | 'faq' | 'contact';

type ContentEntry = {
  key: string;
  expected: string;
  read: (container: HTMLElement) => string;
};

type FixtureText = {
  key: string;
  value: string;
};

const pagePaths: Record<PublicPage, string> = {
  home: '/',
  about: '/nosotros',
  services: '/servicios',
  faq: '/faq',
  contact: '/contacto',
};

const pageRenderers: Record<PublicPage, () => ReactElement> = {
  home: () => <HomePage />,
  about: () => <AboutPage />,
  services: () => <ServicesPage />,
  faq: () => <FaqPage />,
  contact: () => <ContactPage />,
};

function renderPublicPage(page: PublicPage): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[pagePaths[page]]}>
      <AppShell>{pageRenderers[page]()}</AppShell>
    </MemoryRouter>,
  );
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
  index = 0,
): T {
  const element = root.querySelectorAll<T>(selector).item(index);

  if (!element) {
    throw new Error(`Expected element ${selector}[${index}] was not rendered.`);
  }

  return element;
}

function getMain(container: HTMLElement): HTMLElement {
  return requireElement<HTMLElement>(container, '#main-content');
}

function textSequence(root: ParentNode, selector: string): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).map(
    (element) => element.textContent ?? '',
  );
}

function visibleText(values: readonly FixtureText[]): FixtureText[] {
  return values.filter(({ value }) => value.trim().length > 0);
}

function entriesForSequence(
  rootSelector: string,
  elementSelector: string,
  values: readonly FixtureText[],
): ContentEntry[] {
  const visibleValues = visibleText(values);

  return visibleValues.map(({ key, value }, index) => ({
    key,
    expected: value,
    read: (container) =>
      textSequence(requireElement(container, rootSelector), elementSelector)[index] ?? '',
  }));
}

function assertSequence(
  root: ParentNode,
  selector: string,
  expected: readonly string[],
  label: string,
): void {
  expect(textSequence(root, selector), label).toEqual(expected);
}

function assertSharedChrome(container: HTMLElement): void {
  const header = requireElement<HTMLElement>(container, 'header');
  const expectedNavigation = [
    Content_Fixture.brand,
    ...Content_Fixture.nav.items.map((item) => item.label),
  ];
  const navigationLinks = Array.from(header.querySelectorAll('a'));

  expect(
    navigationLinks.map((link) => link.textContent ?? ''),
    'navigation copy must match the fixture character by character',
  ).toEqual(expectedNavigation);
  expect(
    navigationLinks.map((link) => link.getAttribute('href')),
    'navigation destinations must preserve fixture order',
  ).toEqual([
    '/',
    ...Content_Fixture.nav.items.map((item) => item.href),
  ]);

  const footer = requireElement<HTMLElement>(container, 'footer');
  const expectedFooter = [
    Content_Fixture.footer.companyName,
    ...(Content_Fixture.footer.description.trim()
      ? [Content_Fixture.footer.description]
      : []),
    ...Content_Fixture.footer.links.map((link) => link.label),
  ];

  assertSequence(
    footer,
    'p, a',
    expectedFooter,
    'footer copy must match the fixture character by character and order',
  );
}

function homeFixtureEntries(): ContentEntry[] {
  const home = Content_Fixture.home;
  const entries: ContentEntry[] = [
    ...entriesForSequence(
      '[data-home-block="hero"]',
      'p, h1, a',
      [
        { key: 'home.hero.eyebrow', value: home.hero.eyebrow },
        { key: 'home.hero.title', value: home.hero.title },
        { key: 'home.hero.description', value: home.hero.description },
        { key: 'home.hero.cta.label', value: home.hero.cta.label },
        {
          key: 'home.hero.secondaryCta.label',
          value: home.hero.secondaryCta.label,
        },
      ],
    ),
    ...entriesForSequence(
      '[data-home-block="proposition"]',
      'p',
      [{ key: 'home.proposition', value: home.proposition }],
    ),
    ...entriesForSequence(
      '[data-home-block="benefits"]',
      'h2, p',
      home.benefits.flatMap((benefit) => [
        { key: `home.benefits.${benefit.id}.title`, value: benefit.title },
        {
          key: `home.benefits.${benefit.id}.description`,
          value: benefit.description,
        },
      ]),
    ),
    ...entriesForSequence(
      '[data-home-block="featured-services"]',
      'h2, p, a',
      home.featuredServices.flatMap((service) => [
        {
          key: `home.featuredServices.${service.id}.title`,
          value: service.title,
        },
        {
          key: `home.featuredServices.${service.id}.description`,
          value: service.description,
        },
        {
          key: `home.featuredServices.${service.id}.cta.label`,
          value: service.cta.label,
        },
      ]),
    ),
    ...entriesForSequence(
      '[data-home-block="cta"]',
      'h2, p, a',
      [
        { key: 'home.ctaTitle', value: home.ctaTitle },
        { key: 'home.ctaDescription', value: home.ctaDescription },
        { key: 'home.cta.label', value: home.cta.label },
      ],
    ),
  ];

  return entries;
}

function assertHomeOrder(container: HTMLElement): void {
  const home = Content_Fixture.home;
  const main = getMain(container);
  const expectedBlocks = [
    'hero',
    ...(home.proposition.trim() ? ['proposition'] : []),
    ...(home.benefits.length > 0 ? ['benefits'] : []),
    ...(home.featuredServices.length > 0 ? ['featured-services'] : []),
    ...(home.cta.label.trim() ? ['cta'] : []),
  ];
  const blocks = Array.from(
    main.querySelectorAll<HTMLElement>('[data-home-block]'),
  );

  expect(blocks.map((block) => block.dataset.homeBlock)).toEqual(expectedBlocks);

  const expectedBlockValues = [
    [
      home.hero.eyebrow,
      home.hero.title,
      home.hero.description,
      home.hero.cta.label,
      home.hero.secondaryCta.label,
    ].filter((value) => value.trim()),
    ...(home.proposition.trim() ? [[home.proposition]] : []),
    ...(home.benefits.length > 0
      ? [
          home.benefits.flatMap((benefit) =>
            [benefit.title, benefit.description].filter((value) => value.trim()),
          ),
        ]
      : []),
    ...(home.featuredServices.length > 0
      ? [
          home.featuredServices.flatMap((service) =>
            [
              service.title,
              service.description,
              service.cta.label,
            ].filter((value) => value.trim()),
          ),
        ]
      : []),
    ...(home.cta.label.trim()
      ? [[home.ctaTitle, home.ctaDescription, home.cta.label].filter((value) => value.trim())]
      : []),
  ];

  blocks.forEach((block, index) => {
    expect(block.textContent ?? '', `home block ${expectedBlocks[index]}`).toBe(
      expectedBlockValues[index]?.join('') ?? '',
    );
  });

  const ctaLinks = Array.from(main.querySelectorAll<HTMLAnchorElement>('[data-home-block] a'));
  const expectedCtas = [
    ...(home.hero.cta.label.trim() ? [home.hero.cta] : []),
    ...(home.hero.secondaryCta.label.trim() ? [home.hero.secondaryCta] : []),
    ...home.featuredServices.flatMap((service) =>
      service.cta.label.trim() ? [service.cta] : [],
    ),
    ...(home.cta.label.trim() ? [home.cta] : []),
  ];

  expect(ctaLinks.map((link) => link.textContent ?? '')).toEqual(
    expectedCtas.map((cta) => cta.label),
  );
  expect(ctaLinks.map((link) => link.getAttribute('href'))).toEqual(
    expectedCtas.map((cta) => cta.href),
  );
}

function aboutFixtureEntries(): ContentEntry[] {
  const about = Content_Fixture.about;

  return [
    ...entriesForSequence('[data-testid="about-page"]', 'h1', [
      { key: 'about.title', value: about.title },
    ]),
    ...entriesForSequence('[data-about-block="identity"]', 'p', [
      { key: 'about.identity', value: about.identity },
    ]),
    ...entriesForSequence('[data-about-block="history"]', 'p', [
      { key: 'about.history', value: about.history },
    ]),
    ...entriesForSequence(
      '[data-about-block="values"]',
      'h2, p',
      about.values.flatMap((value) => [
        { key: `about.values.${value.id}.title`, value: value.title },
        {
          key: `about.values.${value.id}.description`,
          value: value.description,
        },
      ]),
    ),
  ];
}

function assertAboutOrder(container: HTMLElement): void {
  const about = Content_Fixture.about;
  const main = getMain(container);
  const blocks = Array.from(
    main.querySelectorAll<HTMLElement>('[data-about-block]'),
  );
  const expectedBlockNames = [
    ...(about.identity.trim() ? ['identity'] : []),
    ...(about.history.trim() ? ['history'] : []),
    ...(about.values.length > 0 ? ['values'] : []),
  ];

  expect(blocks.map((block) => block.dataset.aboutBlock)).toEqual(
    expectedBlockNames,
  );
  expect(requireElement(main, 'h1').textContent ?? '').toBe(about.title);

  const expectedBlockValues = [
    ...(about.identity.trim() ? [[about.identity]] : []),
    ...(about.history.trim() ? [[about.history]] : []),
    ...(about.values.length > 0
      ? [
          about.values.flatMap((value) =>
            [value.title, value.description].filter((text) => text.trim()),
          ),
        ]
      : []),
  ];

  blocks.forEach((block, index) => {
    expect(block.textContent ?? '', `about block ${expectedBlockNames[index]}`).toBe(
      expectedBlockValues[index]?.join('') ?? '',
    );
  });
}

function servicesFixtureEntries(): ContentEntry[] {
  const services = Content_Fixture.services;
  const entries: ContentEntry[] = [
    ...entriesForSequence('[aria-labelledby="services-page-title"]', 'h1', [
      { key: 'nav.services', value: Content_Fixture.nav.services },
    ]),
  ];

  services.forEach((service, serviceIndex) => {
    const values = [
      { key: `services.${service.id}.title`, value: service.title },
      {
        key: `services.${service.id}.description`,
        value: service.description,
      },
      { key: `services.${service.id}.cta`, value: service.cta },
    ];
    const visibleValues = visibleText(values);

    visibleValues.forEach(({ key, value }, valueIndex) => {
      entries.push({
        key,
        expected: value,
        read: (container) => {
          const cards = getMain(container).querySelectorAll<HTMLElement>('article');
          const card = cards.item(serviceIndex);
          return card
            ? textSequence(card, 'h2, p, a')[valueIndex] ?? ''
            : '';
        },
      });
    });
  });

  return entries;
}

function assertServicesOrder(container: HTMLElement): void {
  const main = getMain(container);
  const services = Content_Fixture.services;
  const cards = Array.from(main.querySelectorAll<HTMLElement>('article'));

  expect(requireElement(main, 'h1').textContent ?? '').toBe(
    Content_Fixture.nav.services,
  );
  expect(cards).toHaveLength(services.length);

  cards.forEach((card, index) => {
    const service = services[index];
    if (!service) {
      throw new Error(`Missing service fixture entry at index ${index}.`);
    }

    const expected = [service.title, service.description, service.cta].filter(
      (value) => value.trim(),
    );
    expect(card.textContent ?? '', `service ${service.id}`).toBe(expected.join(''));

    const cta = requireElement<HTMLAnchorElement>(card, 'a');
    expect(cta.textContent ?? '').toBe(service.cta);
    expect(cta.getAttribute('href')).toBe(service.ctaHref);
  });
}

function faqFixtureEntries(): ContentEntry[] {
  const faq = Content_Fixture.faq;
  const entries: ContentEntry[] = [
    ...entriesForSequence('[aria-labelledby="faq-page-title"]', 'h1', [
      { key: 'faq.title', value: faq.title },
    ]),
  ];

  faq.items.forEach((item, itemIndex) => {
    entries.push(
      {
        key: `faq.items.${item.id}.question`,
        expected: item.question,
        read: (container) =>
          textSequence(getMain(container), 'button[aria-controls^="faq-answer-"]')[
            itemIndex
          ] ?? '',
      },
      {
        key: `faq.items.${item.id}.answer`,
        expected: item.answer,
        read: (container) =>
          textSequence(getMain(container), '[role="region"]')[itemIndex] ?? '',
      },
    );
  });

  return entries.filter(({ expected }) => expected.trim().length > 0);
}

function assertFaqOrder(container: HTMLElement): void {
  const main = getMain(container);
  const faq = Content_Fixture.faq;
  const questions = textSequence(main, 'button[aria-controls^="faq-answer-"]');
  const answers = textSequence(main, '[role="region"]');

  expect(requireElement(main, 'h1').textContent ?? '').toBe(faq.title);
  expect(questions).toEqual(faq.items.map((item) => item.question));
  expect(answers).toEqual(faq.items.map((item) => item.answer));

  const orderedCopy = [faq.title, ...faq.items.flatMap((item) => [item.question, item.answer])];
  expect(main.textContent ?? '').toBe(orderedCopy.join(''));
}

function contactFixtureEntries(): ContentEntry[] {
  const contact = Content_Fixture.contact;
  const entries: ContentEntry[] = [
    ...entriesForSequence('[data-testid="contact-page"]', 'h1', [
      { key: 'contact.title', value: contact.title },
    ]),
    ...entriesForSequence('[data-testid="contact-page"]', ':scope > header p', [
      { key: 'contact.description', value: contact.description },
    ]),
    ...entriesForSequence('[data-contact-block="corporate-data"]', 'p', [
      {
        key: 'contact.corporateData.companyName',
        value: contact.corporateData.companyName,
      },
      {
        key: 'contact.corporateData.whatsapp',
        value: `${contact.corporateData.whatsappLabel} ${contact.corporateData.whatsappDisplay}`,
      },
      {
        key: 'contact.corporateData.schedule',
        value: contact.corporateData.schedule,
      },
    ]),
    ...entriesForSequence(
      '[data-contact-block="channels"]',
      'a',
      contact.channels.map((channel, index) => ({
        key: `contact.channels.${index}.label`,
        value: channel.label,
      })),
    ),
    ...entriesForSequence('[data-contact-block="whatsapp-cta"]', 'a', [
      { key: 'contact.whatsappCta.label', value: contact.whatsappCta.label },
    ]),
    ...entriesForSequence(
      '[data-contact-block="form"]',
      'h2, label, button[type="submit"]',
      [
        { key: 'contact.form.title', value: contact.form.title },
        ...(['fullName', 'email', 'phone', 'service', 'message'] as const).map(
          (field) => ({
            key: `contact.form.labels.${field}`,
            value: contact.form.labels[field],
          }),
        ),
        {
          key: 'contact.form.submitLabel',
          value: contact.form.submitLabel,
        },
      ],
    ),
  ];

  return entries;
}

function assertContactOrder(container: HTMLElement): void {
  const main = getMain(container);
  const contact = Content_Fixture.contact;
  const page = requireElement<HTMLElement>(main, '[data-testid="contact-page"]');
  const blocks = Array.from(
    page.querySelectorAll<HTMLElement>('[data-contact-block]'),
  );

  expect(blocks.map((block) => block.dataset.contactBlock)).toEqual([
    'corporate-data',
    'channels',
    'whatsapp-cta',
    'form',
  ]);
  expect(requireElement(page, 'h1').textContent ?? '').toBe(contact.title);

  if (contact.description.trim()) {
    expect(requireElement(page, 'header p').textContent ?? '').toBe(
      contact.description,
    );
  }

  expect(
    textSequence(requireElement(page, '[data-contact-block="corporate-data"]'), 'p'),
  ).toEqual([
    contact.corporateData.companyName,
    `${contact.corporateData.whatsappLabel} ${contact.corporateData.whatsappDisplay}`,
    contact.corporateData.schedule,
  ]);
  expect(
    textSequence(requireElement(page, '[data-contact-block="channels"]'), 'a'),
  ).toEqual(contact.channels.map((channel) => channel.label));
  expect(
    textSequence(requireElement(page, '[data-contact-block="whatsapp-cta"]'), 'a'),
  ).toEqual([contact.whatsappCta.label]);

  const form = requireElement(page, '[data-contact-block="form"]');
  expect(textSequence(form, 'h2, label')).toEqual([
    contact.form.title,
    ...(['fullName', 'email', 'phone', 'service', 'message'] as const).map(
      (field) => contact.form.labels[field],
    ),
  ]);

  const submitButton = requireElement<HTMLButtonElement>(
    form,
    'button[type="submit"]',
  );
  if (contact.form.submitLabel.trim()) {
    expect(submitButton.textContent ?? '').toBe(contact.form.submitLabel);
  }
}

const pageAssertions: Record<
  PublicPage,
  { entries: () => ContentEntry[]; assertOrder: (container: HTMLElement) => void }
> = {
  home: { entries: homeFixtureEntries, assertOrder: assertHomeOrder },
  about: { entries: aboutFixtureEntries, assertOrder: assertAboutOrder },
  services: { entries: servicesFixtureEntries, assertOrder: assertServicesOrder },
  faq: { entries: faqFixtureEntries, assertOrder: assertFaqOrder },
  contact: { entries: contactFixtureEntries, assertOrder: assertContactOrder },
};

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry);
    if (statSync(filePath).isDirectory()) {
      return sourceFiles(filePath);
    }

    return /\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)
      ? [filePath]
      : [];
  });
}

describe('Property 9: correspondencia exacta de contenido', () => {
  /** **Validates: Requirements 1.1–1.8, 13.9** */
  it.each(Object.keys(pageAssertions) as PublicPage[])(
    'preserves every visible %s fixture entry and block order',
    (page) => {
      const entries = pageAssertions[page].entries();
      const entryArbitrary = fc.constantFrom(...entries);

      fc.assert(
        fc.property(entryArbitrary, (entry) => {
          const rendered = renderPublicPage(page);

          try {
            assertSharedChrome(rendered.container);
            pageAssertions[page].assertOrder(rendered.container);
            expect(entry.read(rendered.container), entry.key).toBe(entry.expected);
          } finally {
            cleanup();
          }
        }),
        { numRuns: 100 },
      );
    },
  );

  it('does not use dangerouslySetInnerHTML in client source', () => {
    const clientSourceRoot = resolve(process.cwd(), 'client', 'src');
    const dangerousUsages = sourceFiles(clientSourceRoot).flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8');
      return /\bdangerouslySetInnerHTML\b/.test(source) ? [filePath] : [];
    });

    expect(dangerousUsages).toEqual([]);
  });
});
