import type { RequestHandler } from 'express';
export type ServerNodeEnvironment = 'development' | 'test' | 'production';
/** Applies response headers that do not depend on an endpoint implementation. */
export declare function securityHeadersMiddleware(nodeEnv: ServerNodeEnvironment): RequestHandler;
