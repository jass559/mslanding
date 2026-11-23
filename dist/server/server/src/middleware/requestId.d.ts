import type { RequestHandler } from 'express';
export declare const REQUEST_ID_HEADER = "X-Request-ID";
export declare function createRequestId(): string;
/** Adds a bounded, non-sensitive correlation id to every HTTP response. */
export declare function requestIdMiddleware(): RequestHandler;
