import { type ErrorRequestHandler, type RequestHandler } from 'express';
export declare const JSON_BODY_LIMIT = "32kb";
export declare const jsonBodyMiddleware: RequestHandler;
/** Converts parser failures into safe JSON without exposing parser internals. */
export declare const jsonBodyErrorHandler: ErrorRequestHandler;
