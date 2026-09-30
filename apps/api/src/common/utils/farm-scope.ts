import { BadRequestException, NotFoundException } from '@nestjs/common';
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
  options: { requireActive?: boolean } = {},
) {
  if (!id) return null;
  const lot = await db.herdLot.findFirst({
    where: { id, farmId, deletedAt: null },
  });
  if (!lot) throw new NotFoundException('Lote não encontrado');
  if (options.requireActive && lot.status !== 'ATIVO') {
    throw new BadRequestException(
      'Este lote está encerrado. Reative-o para fazer novos lançamentos.',
    );
  }
  return lot;
}

/**
 * `requireActive`: use em novos lançamentos (lote, nascimento, mortalidade...).
 * Retiro inativo mantém o histórico, mas não recebe novos registros.
 */
export async function assertRetiroInFarm(
  db: ScopeDb,
  farmId: string,
  id?: string | null,
  options: { requireActive?: boolean } = {},
) {
  if (!id) return null;
  const retiro = await db.retiro.findFirst({
    where: { id, farmId, deletedAt: null },
  });
  if (!retiro) throw new NotFoundException('Retiro não encontrado');
  if (options.requireActive && !retiro.active) {
    throw new BadRequestException(
      'Este retiro está inativo. Reative-o para fazer novos lançamentos.',
    );
  }
  return retiro;
}

export async function assertVehicleInFarm(
  db: ScopeDb,
  farmId: string,
  id?: string | null,
  options: { requireActive?: boolean } = {},
) {
  if (!id) return null;
  const vehicle = await db.vehicle.findFirst({
    where: { id, farmId, deletedAt: null },
  });
  if (!vehicle) throw new NotFoundException('Veículo não encontrado');
  if (options.requireActive && !vehicle.active) {
    throw new BadRequestException(
      'Este veículo está inativo. Reative-o para registrar abastecimento ou manutenção.',
    );
  }
  return vehicle;
}
