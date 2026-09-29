import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertLotInFarm,
  assertRetiroInFarm,
} from '../common/utils/farm-scope';
import {
  CreateBirthDto,
  CreateCullDto,
  CreateHerdLotDto,
  CreateMortalityDto,
  CreateMovementDto,
  CreatePregnancyDiagnosisDto,
  CreateReplacementDto,
  CreateWeighingDto,
  UpdateHerdLotDto,
} from './dto/herd.dto';

@Injectable()
export class HerdService {
  constructor(private readonly prisma: PrismaService) {}

  listLots(farmId: string, retiroId?: string) {
    return this.prisma.herdLot.findMany({
      where: {
        farmId,
        deletedAt: null,
        ...(retiroId ? { retiroId } : {}),
      },
      include: { retiro: { select: { id: true, name: true } } },
      orderBy: [{ system: 'asc' }, { name: 'asc' }],
    });
  }

  async createLot(farmId: string, dto: CreateHerdLotDto) {
    await assertRetiroInFarm(this.prisma, farmId, dto.retiroId);
    return this.prisma.herdLot.create({
      data: {
        farmId,
        retiroId: dto.retiroId || null,
        name: dto.name,
        category: dto.category,
        system: dto.system,
        sex: dto.sex ?? 'MISTO',
        quantity: dto.quantity,
        initialQuantity: dto.initialQuantity ?? dto.quantity,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
        entryWeightKg: dto.entryWeightKg,
        targetWeightKg: dto.targetWeightKg,
        trackingMode: dto.trackingMode ?? 'LOTE',
        notes: dto.notes,
      },
      include: { retiro: { select: { id: true, name: true } } },
    });
  }

  async updateLot(farmId: string, id: string, dto: UpdateHerdLotDto) {
    await this.getLot(farmId, id);
    await assertRetiroInFarm(this.prisma, farmId, dto.retiroId);
    const { entryDate, ...rest } = dto;
    return this.prisma.herdLot.update({
      where: { id },
      data: {
        ...rest,
        ...(entryDate !== undefined
          ? { entryDate: entryDate ? new Date(entryDate) : null }
          : {}),
      },
      include: { retiro: { select: { id: true, name: true } } },
    });
  }

  async getLotDetail(farmId: string, id: string) {
    const lot = await this.prisma.herdLot.findFirst({
      where: { id, farmId, deletedAt: null },
      include: {
        retiro: { select: { id: true, name: true } },
        weighings: { orderBy: { date: 'asc' } },
      },
    });
    if (!lot) throw new NotFoundException('Lote não encontrado');

    const entryWeight = lot.entryWeightKg != null ? Number(lot.entryWeightKg) : null;
    const targetWeight =
      lot.targetWeightKg != null ? Number(lot.targetWeightKg) : null;
    const entryDate = lot.entryDate ?? lot.createdAt;
    const now = new Date();
    const daysInLot = Math.max(
      0,
      Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const weighingHistory = lot.weighings.map((w, index) => {
      const avg = Number(w.avgWeightKg);
      let gmd: number | null = null;
      if (index === 0) {
        if (entryWeight != null && entryDate) {
          const days =
            (w.date.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
          if (days > 0) gmd = Number(((avg - entryWeight) / days).toFixed(3));
        }
      } else {
        const prev = lot.weighings[index - 1];
        const days =
          (w.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 0) {
          gmd = Number(
            ((avg - Number(prev.avgWeightKg)) / days).toFixed(3),
          );
        }
      }
      return {
        id: w.id,
        date: w.date,
        quantity: w.quantity,
        avgWeightKg: avg,
        totalWeightKg: Number((avg * w.quantity).toFixed(1)),
        gmd,
        notes: w.notes,
      };
    });

    const lastWeighing = weighingHistory[weighingHistory.length - 1];
    const currentWeight = lastWeighing?.avgWeightKg ?? entryWeight;
    const weightGainPerAnimal =
      currentWeight != null && entryWeight != null
        ? Number((currentWeight - entryWeight).toFixed(2))
        : null;

    let gmdAccumulated: number | null = null;
    if (
      currentWeight != null &&
      entryWeight != null &&
      daysInLot > 0
    ) {
      gmdAccumulated = Number(
        ((currentWeight - entryWeight) / daysInLot).toFixed(3),
      );
    }

    const periodGmd =
      weighingHistory.length > 0
        ? weighingHistory[weighingHistory.length - 1].gmd
        : gmdAccumulated;

    const remainingToTarget =
      currentWeight != null && targetWeight != null
        ? Number((targetWeight - currentWeight).toFixed(2))
        : null;

    let daysToTarget: number | null = null;
    let estimatedTargetDate: string | null = null;
    const gmdForProjection = periodGmd ?? gmdAccumulated;
    if (
      remainingToTarget != null &&
      remainingToTarget > 0 &&
      gmdForProjection != null &&
      gmdForProjection > 0
    ) {
      daysToTarget = Math.ceil(remainingToTarget / gmdForProjection);
      const est = new Date(now);
      est.setDate(est.getDate() + daysToTarget);
      estimatedTargetDate = est.toISOString();
    } else if (remainingToTarget != null && remainingToTarget <= 0) {
      daysToTarget = 0;
      estimatedTargetDate = now.toISOString();
    }

    const { weighings: _weighings, ...lotData } = lot;

    return {
      lot: {
        ...lotData,
        entryWeightKg: entryWeight,
        targetWeightKg: targetWeight,
      },
      indicators: {
        daysInLot,
        currentWeightKg: currentWeight,
        weightGainPerAnimal,
        gmdPeriod: periodGmd,
        gmdAccumulated,
        remainingToTargetKg: remainingToTarget,
        daysToTarget,
        estimatedTargetDate,
      },
      weighings: weighingHistory,
    };
  }

  async removeLot(farmId: string, id: string) {
    await this.getLot(farmId, id);
    return this.prisma.herdLot.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ENCERRADO' },
    });
  }

  listBirths(farmId: string, retiroId?: string) {
    return this.prisma.birthRecord.findMany({
      where: {
        farmId,
        ...(retiroId
          ? { OR: [{ retiroId }, { herdLot: { retiroId } }] }
          : {}),
      },
      include: { herdLot: true, retiro: true },
      orderBy: { date: 'desc' },
    });
  }

  async createBirth(farmId: string, dto: CreateBirthDto) {
    return this.prisma.$transaction(async (tx) => {
      await assertRetiroInFarm(tx, farmId, dto.retiroId);
      const lot = await assertLotInFarm(tx, farmId, dto.herdLotId);
      const retiroId = dto.retiroId || lot?.retiroId || null;

      const record = await tx.birthRecord.create({
        data: {
          farmId,
          retiroId,
          date: new Date(dto.date),
          matricesParidas: dto.matricesParidas,
          bezerros: dto.bezerros,
          bezerras: dto.bezerras,
          herdLotId: dto.herdLotId,
          notes: dto.notes,
        },
      });

      if (dto.herdLotId) {
        await tx.herdLot.update({
          where: { id: dto.herdLotId },
          data: { quantity: { increment: dto.bezerros + dto.bezerras } },
        });
      }

      return record;
    });
  }

  listMortalities(farmId: string, retiroId?: string) {
    return this.prisma.mortalityRecord.findMany({
      where: {
        farmId,
        ...(retiroId
          ? { OR: [{ retiroId }, { herdLot: { retiroId } }] }
          : {}),
      },
      include: { herdLot: true, retiro: true },
      orderBy: { date: 'desc' },
    });
  }

  async createMortality(farmId: string, dto: CreateMortalityDto) {
    return this.prisma.$transaction(async (tx) => {
      await assertRetiroInFarm(tx, farmId, dto.retiroId);
      let retiroId = dto.retiroId || null;
      if (dto.herdLotId) {
        const lot = await assertLotInFarm(tx, farmId, dto.herdLotId);
        if (!lot) throw new NotFoundException('Lote não encontrado');
        if (lot.quantity < dto.quantity) {
          throw new BadRequestException('Quantidade maior que o lote');
        }
        retiroId = retiroId ?? lot.retiroId;
        await tx.herdLot.update({
          where: { id: lot.id },
          data: { quantity: { decrement: dto.quantity } },
        });
      }

      return tx.mortalityRecord.create({
        data: {
          farmId,
          retiroId,
          date: new Date(dto.date),
          quantity: dto.quantity,
          category: dto.category,
          herdLotId: dto.herdLotId,
          cause: dto.cause,
          notes: dto.notes,
        },
      });
    });
  }

  listCulls(farmId: string) {
    return this.prisma.cullRecord.findMany({
      where: { farmId },
      include: { herdLot: true },
      orderBy: { date: 'desc' },
    });
  }

  async createCull(farmId: string, dto: CreateCullDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.herdLotId) {
        const lot = await tx.herdLot.findFirst({
          where: { id: dto.herdLotId, farmId, deletedAt: null },
        });
        if (!lot) throw new NotFoundException('Lote não encontrado');
        if (lot.quantity < dto.quantity) {
          throw new BadRequestException('Quantidade maior que o lote');
        }
        await tx.herdLot.update({
          where: { id: lot.id },
          data: { quantity: { decrement: dto.quantity } },
        });
      }

      return tx.cullRecord.create({
        data: {
          farmId,
          date: new Date(dto.date),
          quantity: dto.quantity,
          reason: dto.reason,
          herdLotId: dto.herdLotId,
          notes: dto.notes,
        },
      });
    });
  }

  listReplacements(farmId: string) {
    return this.prisma.replacementRecord.findMany({
      where: { farmId },
      include: { herdLot: true },
      orderBy: { date: 'desc' },
    });
  }

  async createReplacement(farmId: string, dto: CreateReplacementDto) {
    const totalCost = new Prisma.Decimal(dto.unitCost).mul(dto.quantity);
    return this.prisma.$transaction(async (tx) => {
      if (dto.herdLotId) {
        await assertLotInFarm(tx, farmId, dto.herdLotId);
        await tx.herdLot.update({
          where: { id: dto.herdLotId },
          data: { quantity: { increment: dto.quantity } },
        });
      }

      const record = await tx.replacementRecord.create({
        data: {
          farmId,
          date: new Date(dto.date),
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          totalCost,
          herdLotId: dto.herdLotId,
          supplier: dto.supplier,
          notes: dto.notes,
        },
      });

      await tx.expense.create({
        data: {
          farmId,
          costCenter: 'PROPRIEDADE',
          description: `Reposição de plantel (${dto.quantity} matrizes)`,
          amount: totalCost,
          date: new Date(dto.date),
        },
      });

      return record;
    });
  }

  listMovements(farmId: string) {
    return this.prisma.herdMovement.findMany({
      where: { farmId },
      include: { fromLot: true, toLot: true },
      orderBy: { date: 'desc' },
    });
  }

  async createMovement(farmId: string, dto: CreateMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.fromLotId) {
        const from = await tx.herdLot.findFirst({
          where: { id: dto.fromLotId, farmId, deletedAt: null },
        });
        if (!from) throw new NotFoundException('Lote de origem não encontrado');
        if (from.quantity < dto.quantity) {
          throw new BadRequestException('Quantidade maior que o lote de origem');
        }
        await tx.herdLot.update({
          where: { id: from.id },
          data: { quantity: { decrement: dto.quantity } },
        });
      }

      if (dto.toLotId) {
        await assertLotInFarm(tx, farmId, dto.toLotId);
        await tx.herdLot.update({
          where: { id: dto.toLotId },
          data: {
            quantity: { increment: dto.quantity },
            ...(dto.toSystem ? { system: dto.toSystem } : {}),
          },
        });
      }

      const movement = await tx.herdMovement.create({
        data: {
          farmId,
          type: dto.type,
          date: new Date(dto.date),
          quantity: dto.quantity,
          fromLotId: dto.fromLotId,
          toLotId: dto.toLotId,
          toSystem: dto.toSystem,
          unitPrice: dto.unitPrice,
          totalPrice: dto.totalPrice,
          weightArroba: dto.weightArroba,
          notes: dto.notes,
        },
      });

      if (dto.type === 'VENDA' && dto.totalPrice) {
        await tx.revenue.create({
          data: {
            farmId,
            type: 'VENDA_GADO',
            description: `Venda de gado (${dto.quantity} cabeças)`,
            amount: dto.totalPrice,
            date: new Date(dto.date),
            quantity: dto.quantity,
            weightArroba: dto.weightArroba,
          },
        });
      }

      return movement;
    });
  }

  listWeighings(farmId: string) {
    return this.prisma.lotWeighing.findMany({
      where: { farmId },
      include: { herdLot: true },
      orderBy: { date: 'desc' },
    });
  }

  createWeighing(farmId: string, dto: CreateWeighingDto) {
    return this.createWeighingInternal(farmId, dto);
  }

  listPregnancyDiagnoses(farmId: string, retiroId?: string) {
    return this.prisma.pregnancyDiagnosis.findMany({
      where: {
        farmId,
        ...(retiroId ? { retiroId } : {}),
      },
      include: {
        retiro: { select: { id: true, name: true } },
        herdLot: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async createPregnancyDiagnosis(
    farmId: string,
    dto: CreatePregnancyDiagnosisDto,
  ) {
    if (!dto.retiroId && !dto.herdLotId) {
      throw new BadRequestException(
        'Informe o retiro ou o lote do diagnóstico',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let retiroId = dto.retiroId || null;
      if (!retiroId && dto.herdLotId) {
        const lot = await tx.herdLot.findFirst({
          where: { id: dto.herdLotId, farmId, deletedAt: null },
        });
        if (!lot) throw new NotFoundException('Lote não encontrado');
        retiroId = lot.retiroId;
      }

      if (retiroId) {
        const retiro = await tx.retiro.findFirst({
          where: { id: retiroId, farmId, deletedAt: null },
        });
        if (!retiro) throw new NotFoundException('Retiro não encontrado');
      }

      if (dto.herdLotId) {
        const lot = await tx.herdLot.findFirst({
          where: { id: dto.herdLotId, farmId, deletedAt: null },
        });
        if (!lot) throw new NotFoundException('Lote não encontrado');
      }

      const diagnosis = await tx.pregnancyDiagnosis.create({
        data: {
          farmId,
          retiroId,
          herdLotId: dto.herdLotId || null,
          date: new Date(dto.date),
          pregnantCount: dto.pregnantCount,
          emptyCount: dto.emptyCount,
          method: dto.method ?? 'PALPACAO',
          notes: dto.notes,
        },
        include: {
          retiro: { select: { id: true, name: true } },
          herdLot: { select: { id: true, name: true } },
        },
      });

      if (retiroId) {
        await tx.retiro.update({
          where: { id: retiroId },
          data: {
            matricesPregnant: dto.pregnantCount,
            matricesEmpty: dto.emptyCount,
          },
        });
      }

      return diagnosis;
    });
  }

  private async createWeighingInternal(
    farmId: string,
    dto: CreateWeighingDto,
  ) {
    await this.getLot(farmId, dto.herdLotId);
    return this.prisma.lotWeighing.create({
      data: {
        farmId,
        herdLotId: dto.herdLotId,
        date: new Date(dto.date),
        avgWeightKg: dto.avgWeightKg,
        quantity: dto.quantity,
        notes: dto.notes,
      },
    });
  }

  private async getLot(farmId: string, id: string) {
    const lot = await this.prisma.herdLot.findFirst({
      where: { id, farmId, deletedAt: null },
    });
    if (!lot) throw new NotFoundException('Lote não encontrado');
    return lot;
  }
}
