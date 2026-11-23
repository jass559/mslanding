import { Link } from 'react-router-dom';

import {
  Content_Fixture,
  type CtaContent,
  type ContactFormContent,
} from '../content/contentFixture';
import {
  Contact_Form,
  type ContactFormValues,
} from '../features/contact';

const ctaClasses =
  'brand-cta inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cta-hover motion-reduce:transition-none';

function isExternalCta(
  href: CtaContent['href'],
): href is `https://wa.me/${string}` {
  return href.startsWith('https://wa.me/');
}

function ContactCta({ cta }: { cta: CtaContent }): JSX.Element {
  if (isExternalCta(cta.href)) {
    return (
      <a
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
    <Link className={ctaClasses} to={cta.href}>
      {cta.label}
    </Link>
  );
}

export interface ContactPageProps {
  /** Passes the transport through Contact_Form without coupling the page to Prisma. */
  fetcher?: typeof fetch;
  initialValues?: ContactFormValues;
}

/** Public contact page rendered from Content_Fixture and the shared contact form. */
export function ContactPage({
  fetcher,
  initialValues,
}: ContactPageProps = {}): JSX.Element {
  const contact = Content_Fixture.contact;
  const formContent: ContactFormContent = contact.form;

  return (
    <section
      data-testid="contact-page"
      aria-labelledby="contact-page-title"
      className="fluid-width mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
    >
      <header className="max-w-3xl">
        <h1
          id="contact-page-title"
          className="text-3xl font-bold tracking-tight text-brand-text-primary sm:text-4xl lg:text-5xl"
        >
          {contact.title}
        </h1>
        {contact.description.trim() ? (
          <p className="mt-5 text-base leading-7 text-brand-text-secondary sm:text-lg sm:leading-8">
            {contact.description}
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid min-w-0 gap-6 lg:mt-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-6">
          <section
            data-contact-block="corporate-data"
            aria-labelledby="contact-page-title"
            className="brand-surface min-w-0 rounded-2xl border p-6 sm:p-8"
          >
            <p className="text-xl font-semibold text-brand-text-primary">
              {contact.corporateData.companyName}
            </p>
            <p className="mt-4 break-words text-base leading-7 text-brand-text-secondary">
              <span className="font-semibold text-brand-text-primary">
                {contact.corporateData.whatsappLabel}
              </span>{' '}
              <a
                className="text-brand-accent underline decoration-brand-accent/60 underline-offset-4 transition-colors hover:text-brand-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
                href={contact.corporateData.whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                {contact.corporateData.whatsappDisplay}
              </a>
            </p>
            <p className="mt-3 text-sm leading-6 text-brand-text-secondary">
              {contact.corporateData.schedule}
            </p>
          </section>

          <section
            data-contact-block="channels"
            aria-labelledby="contact-page-title"
            className="brand-surface min-w-0 rounded-2xl border p-6 sm:p-8"
          >
            <ul className="space-y-3">
              {contact.channels.map((channel) => (
                <li key={`${channel.label}-${channel.href}`}>
                  <a
                    className="inline-flex min-h-11 max-w-full items-center break-words rounded-sm text-brand-accent underline decoration-brand-accent/60 underline-offset-4 transition-colors hover:text-brand-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {channel.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section
            data-contact-block="whatsapp-cta"
            aria-labelledby="contact-page-title"
            className="min-w-0"
          >
            <ContactCta cta={contact.whatsappCta} />
          </section>
        </div>

        <section
          data-contact-block="form"
          aria-labelledby="contact-page-title"
          className="min-w-0"
        >
          <Contact_Form fetcher={fetcher} initialValues={initialValues} />
        </section>
      </div>
    </section>
  );
}
