import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-ID';

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function isSafeRequestId(value: string | undefined): value is string {
  return value !== undefined && SAFE_REQUEST_ID.test(value);
}

export function createRequestId(): string {
  return randomUUID();
}

/** Adds a bounded, non-sensitive correlation id to every HTTP response. */
export function requestIdMiddleware(): RequestHandler {
  return (request, response, next) => {
    const providedRequestId = request.get(REQUEST_ID_HEADER);
    const requestId = isSafeRequestId(providedRequestId)
      ? providedRequestId
      : createRequestId();

    request.requestId = requestId;
    response.locals.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  };
}
