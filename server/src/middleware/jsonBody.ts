import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';

export const JSON_BODY_LIMIT = '32kb';

export const jsonBodyMiddleware: RequestHandler = express.json({
  limit: JSON_BODY_LIMIT,
  strict: true,
});

interface BodyParserError {
  type?: string;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const type = (error as BodyParserError).type;
  return type === 'entity.too.large' || type === 'entity.parse.failed';
}

/** Converts parser failures into safe JSON without exposing parser internals. */
export const jsonBodyErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (!isBodyParserError(error)) {
    next(error);
    return;
  }

  if (response.headersSent) {
    next(error);
    return;
  }

  const isTooLarge = error.type === 'entity.too.large';
  response.status(isTooLarge ? 413 : 400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: isTooLarge ? 'Request body is too large.' : 'Invalid JSON body.',
    },
  });
};
