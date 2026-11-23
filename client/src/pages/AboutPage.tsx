import {
  Content_Fixture,
  type ContentFixture,
} from '../content/contentFixture';

/**
 * Public About page. Every visible value comes from the content fixture so the
 * page stays aligned with the approved source and preserves its block order.
 */
export function AboutPage(): JSX.Element {
  const { about } = Content_Fixture;
  const values: ContentFixture['about']['values'] = about.values;

  return (
    <section
      data-testid="about-page"
      aria-labelledby="about-page-title"
      className="fluid-width mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
    >
      <header className="max-w-3xl">
        <h1
          id="about-page-title"
          className="text-3xl font-bold tracking-tight text-brand-text-primary sm:text-4xl lg:text-5xl"
        >
          {about.title}
        </h1>
      </header>

      <div
        role="region"
        aria-labelledby="about-page-title"
        className="mt-10 grid min-w-0 gap-6 lg:mt-14 lg:grid-cols-2"
      >
        {about.identity ? (
          <section
            data-about-block="identity"
            aria-labelledby="about-identity-copy"
            className="brand-surface min-w-0 rounded-2xl border p-6 sm:p-8"
          >
            <p
              id="about-identity-copy"
              className="text-base leading-7 text-brand-text-secondary sm:text-lg"
            >
              {about.identity}
            </p>
          </section>
        ) : null}

        {about.history ? (
          <section
            data-about-block="history"
            aria-labelledby="about-history-copy"
            className="brand-surface min-w-0 rounded-2xl border p-6 sm:p-8"
          >
            <p
              id="about-history-copy"
              className="text-base leading-7 text-brand-text-secondary sm:text-lg"
            >
              {about.history}
            </p>
          </section>
        ) : null}

        {values.length > 0 ? (
          <section
            data-about-block="values"
            aria-labelledby="about-page-title"
            className="brand-surface-raised min-w-0 rounded-2xl border p-6 sm:col-span-2 sm:p-8"
          >
            <ul className="grid min-w-0 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {values.map((value) => (
                <li key={value.id} className="min-w-0">
                  <h2 className="text-xl font-semibold text-brand-text-primary">
                    {value.title}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-brand-text-secondary">
                    {value.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  );
}
