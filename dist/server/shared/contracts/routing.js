"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePublicRoute = resolvePublicRoute;
exports.buildWhatsAppUrl = buildWhatsAppUrl;
const WHATSAPP_NUMBER_FORMAT = /^[0-9+(). -]+$/;
const INTERNATIONAL_NUMBER = /^[1-9][0-9]{6,14}$/;
function invalidWhatsAppNumber() {
    throw new Error('Invalid WhatsApp number configuration.');
}
/**
 * Resolves only the canonical public paths. API paths intentionally fall
 * through to `notFound` so they cannot be rendered as public pages.
 */
function resolvePublicRoute(pathname) {
    switch (pathname) {
        case '/':
            return 'home';
        case '/nosotros':
            return 'about';
        case '/servicios':
            return 'services';
        case '/faq':
            return 'faq';
        case '/contacto':
            return 'contact';
        default:
            return 'notFound';
    }
}
/**
 * Builds a canonical wa.me URL without exposing the configured value in
 * validation errors. Formatting characters are discarded before validating
 * the resulting international number.
 */
function buildWhatsAppUrl(whatsappNumber) {
    if (typeof whatsappNumber !== 'string' ||
        whatsappNumber.length === 0 ||
        !WHATSAPP_NUMBER_FORMAT.test(whatsappNumber)) {
        return invalidWhatsAppNumber();
    }
    const plusMatches = whatsappNumber.match(/\+/g);
    const plusIndex = whatsappNumber.indexOf('+');
    const prefixBeforePlus = plusIndex === -1 ? '' : whatsappNumber.slice(0, plusIndex);
    if ((plusMatches !== null && plusMatches.length > 1) ||
        (plusIndex !== -1 && prefixBeforePlus.trim().length > 0)) {
        return invalidWhatsAppNumber();
    }
    const normalizedNumber = whatsappNumber.replace(/[(). -]/g, '').replace(/^\+/, '');
    if (!INTERNATIONAL_NUMBER.test(normalizedNumber)) {
        return invalidWhatsAppNumber();
    }
    return `https://wa.me/${normalizedNumber}`;
}
//# sourceMappingURL=routing.js.map