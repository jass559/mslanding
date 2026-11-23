import { Link } from 'react-router-dom';

import {
  Content_Fixture,
  type ContentFixture,
  type CtaContent,
} from '../content/contentFixture';

const ctaClasses =
  'brand-cta inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cta-hover motion-reduce:transition-none';

function isExternalCta(
  href: CtaContent['href'],
): href is `https://wa.me/${string}` {
  return href.startsWith('https://wa.me/');
}

function CtaLink({ cta }: { cta: CtaContent }): JSX.Element | null {
  if (!cta.label.trim()) {
    return null;
  }

  if (isExternalCta(cta.href)) {
    return (
      <a
        data-home-cta-link="external"
        className={ctaClasses}
        href={cta.href}
        target="_blank"
        rel="noreferrer"
      >
        {cta.label}
      </a>
    );
  }

  return (
    <Link
      data-home-cta-link="internal"
      className={ctaClasses}
      to={cta.href}
    >
      {cta.label}
    </Link>
  );
}

/** Public home page rendered in the exact order defined by Content_Fixture. */
export function HomePage(): JSX.Element {
  const home: ContentFixture['home'] = Content_Fixture.home;
  const hasProposition = home.proposition.trim().length > 0;
  const hasBenefits = home.benefits.length > 0;
  const hasFeaturedServices = home.featuredServices.length > 0;
  const hasFinalCta = home.cta.label.trim().length > 0;

  return (
    <div
      data-testid="home-page"
      className="fluid-width mx-auto max-w-7xl space-y-12 px-4 py-12 sm:space-y-16 sm:px-6 sm:py-16 lg:space-y-20 lg:px-8 lg:py-20"
    >
      <section
        data-home-block="hero"
        aria-labelledby="home-hero-title"
        className="brand-surface-raised min-w-0 overflow-hidden rounded-3xl border px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
      >
        <div className="max-w-3xl">
          {home.hero.eyebrow.trim() ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-accent">
              {home.hero.eyebrow}
            </p>
          ) : null}
          <h1
            id="home-hero-title"
            className="mt-4 text-4xl font-bold tracking-tight text-brand-text-primary sm:text-5xl lg:text-6xl"
          >
            {home.hero.title}
          </h1>
          {home.hero.description.trim() ? (
            <p className="mt-6 max-w-2xl text-base leading-7 text-brand-text-secondary sm:text-lg sm:leading-8">
              {home.hero.description}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaLink cta={home.hero.cta} />
            <CtaLink cta={home.hero.secondaryCta} />
          </div>
        </div>
      </section>

      {hasProposition ? (
        <section
          data-home-block="proposition"
          aria-labelledby="home-proposition-copy"
          className="min-w-0 rounded-2xl border border-brand-border bg-brand-surface px-6 py-8 sm:px-8 sm:py-10"
        >
          <p
            id="home-proposition-copy"
            className="max-w-4xl text-lg leading-8 text-brand-text-secondary sm:text-xl sm:leading-9"
          >
            {home.proposition}
          </p>
        </section>
      ) : null}

      {hasBenefits ? (
        <section
          data-home-block="benefits"
          className="min-w-0"
        >
          <ul className="grid min-w-0 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {home.benefits.map((benefit) => {
              const benefitTitleId = `home-benefit-${benefit.id}-title`;

              return (
                <li key={benefit.id} className="min-w-0">
                  <article
                    aria-labelledby={
                      benefit.title.trim() ? benefitTitleId : undefined
                    }
                    className="brand-surface min-w-0 rounded-2xl border p-6 sm:p-8"
                  >
                    {benefit.title.trim() ? (
                      <h2
                        id={benefitTitleId}
                        className="text-xl font-semibold text-brand-text-primary"
                      >
                        {benefit.title}
                      </h2>
                    ) : null}
                    {benefit.description.trim() ? (
                      <p className="mt-3 text-base leading-7 text-brand-text-secondary">
                        {benefit.description}
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {hasFeaturedServices ? (
        <section
          data-home-block="featured-services"
          className="min-w-0"
        >
          <ul className="grid min-w-0 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {home.featuredServices.map((service) => {
              const serviceTitleId = `home-featured-service-${service.id}-title`;

              return (
                <li key={service.id} className="min-w-0">
                  <article
                    aria-labelledby={
                      service.title.trim() ? serviceTitleId : undefined
                    }
                    className="brand-surface-raised min-w-0 rounded-2xl border p-6 sm:p-8"
                  >
                    {service.title.trim() ? (
                      <h2
                        id={serviceTitleId}
                        className="text-xl font-semibold text-brand-text-primary"
                      >
                        {service.title}
                      </h2>
                    ) : null}
                    {service.description.trim() ? (
                      <p className="mt-3 text-base leading-7 text-brand-text-secondary">
                        {service.description}
                      </p>
                    ) : null}
                    <div className="mt-6">
                      <CtaLink cta={service.cta} />
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {hasFinalCta ? (
        <section
          data-home-block="cta"
          className="flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-brand-border bg-brand-surface px-6 py-8 sm:px-8 sm:py-10"
        >
          <div className="max-w-3xl">
            {home.ctaTitle.trim() ? (
              <h2 className="text-2xl font-semibold text-brand-text-primary">
                {home.ctaTitle}
              </h2>
            ) : null}
            {home.ctaDescription.trim() ? (
              <p className="mt-3 text-base leading-7 text-brand-text-secondary">
                {home.ctaDescription}
              </p>
            ) : null}
          </div>
          <CtaLink cta={home.cta} />
        </section>
      ) : null}
    </div>
  );
}
