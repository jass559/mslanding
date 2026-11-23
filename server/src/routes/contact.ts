import type { PrismaClient } from '@prisma/client';
import type { Request, RequestHandler, Response } from 'express';

import {
  Contact_Schema,
  normalizeContactInput,
  type ContactField,
} from '../../../shared/validation/contactSchema';

import { createContactLead } from '../services/contactLead';

const CONTACT_FIELDS = [
  'fullName',
  'email',
  'phone',
  'service',
  'message',
] as const satisfies readonly ContactField[];

interface ContactDependencies {
  prisma: PrismaClient;
}

function contactValidationErrors(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
): Partial<Record<ContactField, string[]>> {
  const fields: Partial<Record<ContactField, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      typeof field !== 'string' ||
      !CONTACT_FIELDS.includes(field as ContactField)
    ) {
      continue;
    }

    const fieldName = field as ContactField;
    fields[fieldName] = [...(fields[fieldName] ?? []), issue.message];
  }

  return fields;
}

function sendValidationError(response: Response, error: Parameters<
  typeof contactValidationErrors
>[0]): void {
  const fields = contactValidationErrors(error);
  const payload = Object.keys(fields).length > 0 ? { fields } : undefined;

  response.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid contact data.',
      ...payload,
    },
  });
}

/**
 * Validates and persists one contact request. The response intentionally
 * excludes the Prisma-generated id and createdAt fields.
 */
export async function postContactHandler(
  request: Request,
  response: Response,
  dependencies: ContactDependencies,
): Promise<void> {
  const parsed = Contact_Schema.safeParse(request.body);

  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }

  const normalized = normalizeContactInput(parsed.data);

  try {
    await createContactLead(dependencies.prisma, normalized);
  } catch {
    response.status(500).json({
      error: {
        code: 'PERSISTENCE_ERROR',
        message: 'Unable to create contact.',
      },
    });
    return;
  }

  response.status(201).json({
    success: true,
    code: 'CONTACT_CREATED',
  });
}

/**
 * Handles every method at the canonical contact path so unsupported methods
 * receive a JSON response instead of Express's default HTML response.
 */
export function createContactEndpoint(
  prisma: PrismaClient,
): RequestHandler {
  return (request, response, next) => {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      response.status(405).json({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed.',
        },
      });
      return;
    }

    void postContactHandler(request, response, { prisma }).catch(next);
  };
}
