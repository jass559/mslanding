import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Content_Fixture,
  type ServiceContent,
} from '../content/contentFixture';

/**
 * Public services page rendered entirely from the approved content fixture.
 *
 * The fixture owns the service order, copy, and CTA destinations. Keeping the
 * mapping here direct prevents the page from inventing copy or substituting a
 * destination when the source content changes.
 */
export function ServicesPage(): JSX.Element {
  const services: ServiceContent[] = Content_Fixture.services;

  return (
    <section
      aria-labelledby="services-page-title"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
    >
      <header className="max-w-3xl">
        <h1
          id="services-page-title"
          className="text-3xl font-bold tracking-tight text-brand-text-primary sm:text-4xl"
        >
          {Content_Fixture.nav.services}
        </h1>
      </header>

      {services.length > 0 ? (
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.id} className="min-w-0">
              <article className="brand-surface flex h-full flex-col rounded-lg border p-6 shadow-lg shadow-black/10">
                <h2 className="text-xl font-semibold text-brand-text-primary">
                  {service.title}
                </h2>
                <p className="mt-3 flex-1 leading-7 text-brand-text-secondary">
                  {service.description}
                </p>
                <Link
                  to={service.ctaHref}
                  aria-label={service.cta}
                  className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-sm px-4 py-2 font-semibold text-brand-cta transition-colors hover:text-brand-cta-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
                >
                  <span>{service.cta}</span>
                  <ArrowRight
                    aria-hidden="true"
                    focusable="false"
                    className="h-4 w-4"
                  />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
