import type { ContactLead, PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { createContactLead } from './contactLead';

function createPrismaDouble() {
  const create = vi.fn();
  const prisma = {
    contactLead: { create },
  } as unknown as PrismaClient;

  return { create, prisma };
}

describe('createContactLead', () => {
  it('persists only canonical fields and maps an empty normalized phone to null', async () => {
    const { create, prisma } = createPrismaDouble();
    const createdAt = new Date('2025-01-01T00:00:00.000Z');
    const persistedLead: ContactLead & { status?: string } = {
      id: 'cl_example',
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: null,
      service: 'Mantenimiento',
      message: 'Necesito una cotización para el servicio.',
      createdAt,
      status: 'unexpected-extra',
    };
    create.mockResolvedValue(persistedLead);

    const result = await createContactLead(prisma, {
      fullName: '  Ana Pérez  ',
      email: ' ana@example.com ',
      phone: '   ',
      service: ' Mantenimiento ',
      message: ' Necesito una cotización para el servicio. ',
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        phone: null,
        service: 'Mantenimiento',
        message: 'Necesito una cotización para el servicio.',
      },
    });
    expect(result).toEqual({
      id: 'cl_example',
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: null,
      service: 'Mantenimiento',
      message: 'Necesito una cotización para el servicio.',
      createdAt,
    });
    expect(Object.keys(result)).toEqual([
      'id',
      'fullName',
      'email',
      'phone',
      'service',
      'message',
      'createdAt',
    ]);
  });

  it('propagates persistence exceptions instead of returning a success record', async () => {
    const { create, prisma } = createPrismaDouble();
    const persistenceError = new Error('database unavailable');
    create.mockRejectedValue(persistenceError);

    await expect(
      createContactLead(prisma, {
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        service: 'Mantenimiento',
        message: 'Necesito una cotización para el servicio.',
      }),
    ).rejects.toBe(persistenceError);
  });
});
