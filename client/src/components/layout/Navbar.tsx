import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { Content_Fixture } from '../../content/contentFixture';

const navigationId = 'primary-navigation-menu';

/**
 * Fixed public navigation shared by the corporate pages.
 *
 * The links and labels intentionally come from Content_Fixture so the
 * navigation cannot drift from the approved public routes.
 */
export function Navbar(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { brand, nav } = Content_Fixture;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border bg-brand-surface/95 text-brand-text-primary shadow-lg shadow-black/20 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          end
          aria-label={brand}
          className={({ isActive }) =>
            [
              'inline-flex min-h-11 shrink-0 items-center rounded-sm text-base font-bold tracking-tight text-brand-text-primary transition-colors hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent sm:text-lg',
              isActive
                ? 'border-b-2 border-brand-accent'
                : 'border-b-2 border-transparent',
            ].join(' ')
          }
        >
          {brand}
        </NavLink>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-brand-border bg-brand-surface-raised text-brand-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent md:hidden"
          aria-controls={navigationId}
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? nav.closeMenuLabel : nav.openMenuLabel
          }
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? (
            <X aria-hidden="true" focusable="false" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" focusable="false" className="h-5 w-5" />
          )}
        </button>

        <nav
          id={navigationId}
          aria-label={nav.mainNavLabel}
          className={isMenuOpen ? 'block md:block' : 'hidden md:block'}
        >
          <ul className="absolute inset-x-0 top-full border-b border-brand-border bg-brand-surface px-4 py-3 shadow-lg shadow-black/20 md:static md:flex md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            {nav.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  aria-label={item.label}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      'inline-flex min-h-11 w-full items-center rounded-sm border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent md:w-auto',
                      isActive
                        ? 'border-brand-accent font-semibold text-brand-text-primary'
                        : 'border-transparent text-brand-text-secondary hover:border-brand-accent hover:text-brand-text-primary',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
