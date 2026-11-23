import type { ErrorRequestHandler } from 'express';
/** Final error boundary that keeps internal errors out of HTTP responses. */
export declare const safeErrorHandler: ErrorRequestHandler;
