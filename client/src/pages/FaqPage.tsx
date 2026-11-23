import { ChevronDown } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';

import {
  Content_Fixture,
  type FaqItem,
} from '../content/contentFixture';

export interface FaqAccordionProps {
  items: FaqItem[];
}

function focusItem(
  buttons: Array<HTMLButtonElement | null>,
  index: number,
): void {
  buttons[index]?.focus();
}

/**
 * Keyboard-operable FAQ accordion backed entirely by the content fixture.
 *
 * The question text remains the button's accessible name. Each answer stays in
 * the DOM so its relationship with the controlling button remains explicit,
 * while the hidden attribute removes collapsed answers from the accessibility
 * tree.
 */
export function FaqAccordion({ items }: FaqAccordionProps): JSX.Element {
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set());
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const toggleItem = (index: number): void => {
    setOpenItems((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void => {
    if (items.length === 0) {
      return;
    }

    let nextIndex: number | undefined;

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (index + 1) % items.length;
        break;
      case 'ArrowUp':
        nextIndex = (index - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusItem(buttonRefs.current, nextIndex);
  };

  return (
    <div className="mt-8 w-full space-y-4" data-testid="faq-accordion">
      {items.map((item, index) => {
        const buttonId = `faq-question-${index}`;
        const panelId = `faq-answer-${index}`;
        const isOpen = openItems.has(index);

        return (
          <div
            className="brand-surface overflow-hidden rounded-lg border"
            key={`${item.id}-${index}`}
          >
            <h2 className="m-0">
              <button
                ref={(button) => {
                  buttonRefs.current[index] = button;
                }}
                id={buttonId}
                type="button"
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left text-base font-semibold text-brand-text-primary transition-colors hover:bg-brand-surface-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-accent motion-reduce:transition-none sm:px-6"
                onClick={() => toggleItem(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className="min-w-0">{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  focusable="false"
                  className={`h-5 w-5 shrink-0 text-brand-accent transition-transform motion-reduce:transition-none ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </h2>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="border-t border-brand-border bg-brand-surface-raised px-4 py-4 text-sm leading-7 text-brand-text-secondary sm:px-6"
            >
              <p className="m-0 text-brand-text-secondary">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Public FAQ page rendered from the approved content fixture. */
export function FaqPage(): JSX.Element {
  const { faq } = Content_Fixture;

  return (
    <section
      aria-labelledby="faq-page-title"
      className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <header>
        <h1
          id="faq-page-title"
          className="text-3xl font-bold tracking-tight text-brand-text-primary sm:text-4xl"
        >
          {faq.title}
        </h1>
      </header>
      <FaqAccordion items={faq.items} />
    </section>
  );
}
