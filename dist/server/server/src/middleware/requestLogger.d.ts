import type { RequestHandler } from 'express';
export interface RequestLogEntry {
    method: string;
    route: string;
    status: number;
    durationMs: number;
    requestId: string;
}
export type RequestLogger = (entry: RequestLogEntry) => void;
export declare const defaultRequestLogger: RequestLogger;
/** Logs only request metadata and never reads the request body. */
export declare function requestLoggerMiddleware(logger?: RequestLogger): RequestHandler;
