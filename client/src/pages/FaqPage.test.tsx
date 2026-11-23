import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Content_Fixture,
  type FaqItem,
} from '../content/contentFixture';
import { FaqAccordion, FaqPage } from './FaqPage';

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

function mount(element: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  mountedRoots.push({ container, root });
  return container;
}

function pressKey(button: HTMLButtonElement, key: string): void {
  act(() => {
    button.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key,
      }),
    );

    if (key === 'Enter' || key === ' ') {
      button.click();
    }
  });
}

afterEach(() => {
  mountedRoots.forEach(({ container, root }) => {
    act(() => root.unmount());
    container.remove();
  });
  mountedRoots.length = 0;
});

describe('FaqPage', () => {
  it('renders the fixture title and every FAQ item in fixture order', () => {
    const container = mount(<FaqPage />);
    const fixtureItems: FaqItem[] = Content_Fixture.faq.items;
    const heading = container.querySelector('h1');
    const questions = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        '[aria-controls^="faq-answer-"]',
      ),
    );
    const panels = Array.from(
      container.querySelectorAll<HTMLElement>('[role="region"]'),
    );

    expect(heading?.textContent?.trim()).toBe(Content_Fixture.faq.title);
    expect(questions.map((question) => question.textContent?.trim())).toEqual(
      fixtureItems.map((item) => item.question),
    );
    expect(panels.map((panel) => panel.textContent?.trim())).toEqual(
      fixtureItems.map((item) => item.answer),
    );
  });

  it('links each control to its panel and toggles answers from the keyboard', () => {
    const items: FaqItem[] = [
      { id: 'first', question: 'Question one', answer: 'Answer one' },
      { id: 'second', question: 'Question two', answer: 'Answer two' },
    ];
    const container = mount(<FaqAccordion items={items} />);
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button'),
    );
    const [firstButton, secondButton] = buttons;
    const firstPanel = document.getElementById('faq-answer-0');
    const secondPanel = document.getElementById('faq-answer-1');

    if (!firstButton || !secondButton || !firstPanel || !secondPanel) {
      throw new Error('The FAQ controls and panels were not rendered.');
    }

    expect(firstButton.textContent?.trim()).toContain('Question one');
    expect(secondButton.textContent?.trim()).toContain('Question two');
    expect(firstButton.getAttribute('aria-controls')).toBe(firstPanel.id);
    expect(secondButton.getAttribute('aria-controls')).toBe(secondPanel.id);
    expect(firstPanel.getAttribute('aria-labelledby')).toBe(firstButton.id);
    expect(secondPanel.getAttribute('aria-labelledby')).toBe(secondButton.id);
    expect(firstButton.getAttribute('aria-expanded')).toBe('false');
    expect(firstPanel.hidden).toBe(true);
    expect(firstButton.classList.contains('focus-visible:outline-brand-accent')).toBe(
      true,
    );
    expect(firstButton.classList.contains('motion-reduce:transition-none')).toBe(
      true,
    );

    firstButton.focus();
    pressKey(firstButton, 'ArrowDown');
    expect(document.activeElement).toBe(secondButton);

    pressKey(secondButton, 'Enter');
    expect(secondButton.getAttribute('aria-expanded')).toBe('true');
    expect(secondPanel.hidden).toBe(false);
    expect(secondPanel.textContent).toContain('Answer two');

    pressKey(secondButton, 'ArrowUp');
    expect(document.activeElement).toBe(firstButton);
    pressKey(firstButton, ' ');
    expect(firstButton.getAttribute('aria-expanded')).toBe('true');
    expect(firstPanel.hidden).toBe(false);

    act(() => firstButton.click());
    expect(firstButton.getAttribute('aria-expanded')).toBe('false');
    expect(firstPanel.hidden).toBe(true);
  });
});
