import { type RequestHandler } from 'express';
export declare const API_NOT_FOUND_RESPONSE: {
    readonly error: {
        readonly code: "NOT_FOUND";
        readonly message: "API route not found.";
    };
};
/** Returns true only for the API namespace, not paths such as `/apiary`. */
export declare function isApiPath(pathname: string): boolean;
/**
 * Terminates unmatched API requests before static files or the SPA fallback can
 * handle them as HTML.
 */
export declare const apiNotFoundMiddleware: RequestHandler;
/** Serves only files that exist below the compiled client directory. */
export declare function createClientStaticMiddleware(clientDistPath: string): RequestHandler;
/**
 * Resolves non-API GET/HEAD requests through the SPA entry point after the
 * static middleware has had the opportunity to serve a real file.
 */
export declare function createSpaFallbackMiddleware(clientDistPath: string): RequestHandler;
