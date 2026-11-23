import { Link } from 'react-router-dom';

import { Content_Fixture } from '../content/contentFixture';

/**
 * Safe fallback for unknown public routes.
 *
 * The page intentionally exposes only the 404 status, the approved brand name,
 * and the public navigation from Content_Fixture. It does not render request,
 * server, or infrastructure details.
 */
export function NotFoundPage(): JSX.Element {
  return (
    <section
      data-testid="not-found-page"
      aria-labelledby="not-found-page-title"
      className="mx-auto flex w-full max-w-4xl justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
    >
      <div className="brand-surface-raised w-full min-w-0 rounded-3xl border px-6 py-12 text-center sm:px-10 sm:py-16">
        <p
          aria-hidden="true"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-accent"
        >
          {404}
        </p>
        <h1
          id="not-found-page-title"
          className="mt-4 text-3xl font-bold tracking-tight text-brand-text-primary sm:text-4xl"
        >
          {404}
        </h1>
        <p className="mt-4 text-base leading-7 text-brand-text-secondary">
          {Content_Fixture.brand}
        </p>

        <nav
          aria-labelledby="not-found-page-title"
          className="mt-8"
        >
          <ul className="flex flex-wrap justify-center gap-3">
            {Content_Fixture.nav.items.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  aria-label={item.label}
                  className="inline-flex min-h-11 items-center rounded-sm border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent motion-reduce:transition-none"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
