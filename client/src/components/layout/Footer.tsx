import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Content_Fixture } from '../../content/contentFixture';

/**
 * Shared corporate footer built exclusively from the approved content fixture.
 */
export function Footer(): JSX.Element {
  const { footer } = Content_Fixture;

  return (
    <footer className="border-t border-brand-border bg-brand-surface text-brand-text-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="max-w-sm">
          <p className="text-lg font-semibold tracking-tight text-brand-text-primary">
            {footer.companyName}
          </p>
          {footer.description ? (
            <p className="mt-3 text-sm leading-6 text-brand-text-secondary">
              {footer.description}
            </p>
          ) : null}
        </div>

        <nav
          aria-label={footer.navLabel}
          className="w-full md:max-w-md"
        >
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 md:justify-items-end">
            {footer.links.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  aria-label={link.label}
                  className="group inline-flex min-h-11 items-center gap-2 rounded-sm py-2 text-sm font-medium text-brand-text-secondary transition-colors hover:text-brand-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    focusable="false"
                    className="h-4 w-4 text-brand-accent transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
