import type { ErrorRequestHandler } from 'express';

/** Final error boundary that keeps internal errors out of HTTP responses. */
export const safeErrorHandler: ErrorRequestHandler = (
  _error,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(_error);
    return;
  }

  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    },
  });
};
