export type PublicRoute = 'home' | 'about' | 'services' | 'faq' | 'contact' | 'notFound';
export type WhatsAppUrl = `https://wa.me/${string}`;
/**
 * Resolves only the canonical public paths. API paths intentionally fall
 * through to `notFound` so they cannot be rendered as public pages.
 */
export declare function resolvePublicRoute(pathname: string): PublicRoute;
/**
 * Builds a canonical wa.me URL without exposing the configured value in
 * validation errors. Formatting characters are discarded before validating
 * the resulting international number.
 */
export declare function buildWhatsAppUrl(whatsappNumber: string): WhatsAppUrl;
