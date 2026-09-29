import { NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

/** Aceita tanto `PrismaService` quanto o client de transação. */
type ScopeDb = Pick<Prisma.TransactionClient, 'herdLot' | 'retiro' | 'vehicle'>;

/**
 * Garante que um FK enviado pelo cliente pertence à fazenda ativa
 * (isolamento multi-tenant). Retorna `null` quando o id não foi informado.
 */
export async function assertLotInFarm(
  db: ScopeDb,
  farmId: string,
  id?: string | null,
) {
  if (!id) return null;
  const lot = await db.herdLot.findFirst({
    where: { id, farmId, deletedAt: null },
  });
  if (!lot) throw new NotFoundException('Lote não encontrado');
  return lot;
}

export async function assertRetiroInFarm(
  db: ScopeDb,
  farmId: string,
  id?: string | null,
) {
  if (!id) return null;
  const retiro = await db.retiro.findFirst({
    where: { id, farmId, deletedAt: null },
  });
  if (!retiro) throw new NotFoundException('Retiro não encontrado');
  return retiro;
}

export async function assertVehicleInFarm(
  db: ScopeDb,
  farmId: string,
  id?: string | null,
) {
  if (!id) return null;
  const vehicle = await db.vehicle.findFirst({
    where: { id, farmId, deletedAt: null },
  });
  if (!vehicle) throw new NotFoundException('Veículo não encontrado');
  return vehicle;
}
