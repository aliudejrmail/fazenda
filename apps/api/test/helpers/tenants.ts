import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/prisma/prisma.service';

export const TEST_PASSWORD = 'senha-de-teste-123';

export type Tenant = {
  userId: string;
  email: string;
  farmId: string;
  retiroId: string;
  lotId: string;
  vehicleId: string;
};

/**
 * Cria um "inquilino" isolado: usuário + fazenda + retiro + lote + veículo.
 * Os dados usam sufixo aleatório e são removidos por `destroyTenants`.
 */
export async function createTenant(
  prisma: PrismaService,
  label: string,
): Promise<Tenant> {
  const suffix = randomUUID().slice(0, 8);
  // o login normaliza o e-mail para minúsculas
  const email = `e2e-${label}-${suffix}@fazenda.test`.toLowerCase();

  const user = await prisma.user.create({
    data: {
      name: `E2E ${label}`,
      email,
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
    },
  });

  const farm = await prisma.farm.create({
    data: {
      name: `E2E Fazenda ${label} ${suffix}`,
      memberships: { create: { userId: user.id, role: 'OWNER' } },
    },
  });

  const retiro = await prisma.retiro.create({
    data: { farmId: farm.id, name: `Retiro ${label}` },
  });

  const lot = await prisma.herdLot.create({
    data: {
      farmId: farm.id,
      retiroId: retiro.id,
      name: `Lote ${label}`,
      category: 'MATRIZ',
      system: 'CRIA',
      quantity: 10,
      initialQuantity: 10,
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: { farmId: farm.id, name: `Trator ${label}`, type: 'TRATOR' },
  });

  return {
    userId: user.id,
    email,
    farmId: farm.id,
    retiroId: retiro.id,
    lotId: lot.id,
    vehicleId: vehicle.id,
  };
}

/** Remove fazendas (cascata) e usuários criados pelos testes. */
export async function destroyTenants(
  prisma: PrismaService,
  tenants: Array<Tenant | undefined>,
) {
  const list = tenants.filter((t): t is Tenant => Boolean(t));
  if (!list.length) return;

  await prisma.farm.deleteMany({ where: { id: { in: list.map((t) => t.farmId) } } });
  await prisma.user.deleteMany({ where: { id: { in: list.map((t) => t.userId) } } });
}
