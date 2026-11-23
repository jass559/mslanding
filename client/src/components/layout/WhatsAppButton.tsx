import { MessageCircle } from 'lucide-react';

import { buildWhatsAppUrl } from '@shared/contracts/routing';
import { Content_Fixture } from '../../content/contentFixture';

export interface WhatsAppButtonProps {
  /**
   * Public WhatsApp number after server configuration validation.
   * The fixture value is used for the approved default configuration.
   */
  whatsappNumber?: string;
}

/**
 * Global WhatsApp link. The number is normalized by the shared canonical URL
 * builder and never reads private server configuration in the client bundle.
 */
export function WhatsAppButton({
  whatsappNumber = Content_Fixture.contact.corporateData.whatsappNumber,
}: WhatsAppButtonProps = {}): JSX.Element {
  const { corporateData } = Content_Fixture.contact;
  const href = buildWhatsAppUrl(whatsappNumber);
  const ariaLabel = `${corporateData.whatsappLabel} de ${corporateData.companyName}`;

  return (
    <a
      className="fixed bottom-6 right-4 z-40 mb-[env(safe-area-inset-bottom)] inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full border border-brand-accent bg-brand-accent px-4 text-sm font-semibold text-brand-background shadow-lg shadow-black/40 transition-colors hover:border-brand-cta-hover hover:bg-brand-cta-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cta-hover sm:bottom-8 sm:right-6 md:right-8"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
    >
      <MessageCircle aria-hidden="true" focusable="false" className="h-6 w-6" />
      <span className="sr-only">{corporateData.whatsappLabel}</span>
    </a>
  );
}
