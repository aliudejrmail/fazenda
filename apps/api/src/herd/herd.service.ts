import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBirthDto,
  CreateCullDto,
  CreateHerdLotDto,
  CreateMortalityDto,
  CreateMovementDto,
  CreateReplacementDto,
  CreateWeighingDto,
  UpdateHerdLotDto,
} from './dto/herd.dto';

@Injectable()
export class HerdService {
  constructor(private readonly prisma: PrismaService) {}

  listLots(farmId: string) {
    return this.prisma.herdLot.findMany({
      where: { farmId, deletedAt: null },
      orderBy: [{ system: 'asc' }, { name: 'asc' }],
    });
  }

  async createLot(farmId: string, dto: CreateHerdLotDto) {
    return this.prisma.herdLot.create({
      data: {
        farmId,
        name: dto.name,
        category: dto.category,
        system: dto.system,
        quantity: dto.quantity,
        trackingMode: dto.trackingMode ?? 'LOTE',
        notes: dto.notes,
      },
    });
  }

  async updateLot(farmId: string, id: string, dto: UpdateHerdLotDto) {
    await this.getLot(farmId, id);
    return this.prisma.herdLot.update({ where: { id }, data: dto });
  }

  async removeLot(farmId: string, id: string) {
    await this.getLot(farmId, id);
    return this.prisma.herdLot.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ENCERRADO' },
    });
  }

  listBirths(farmId: string) {
    return this.prisma.birthRecord.findMany({
      where: { farmId },
      include: { herdLot: true },
      orderBy: { date: 'desc' },
    });
  }

  async createBirth(farmId: string, dto: CreateBirthDto) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.birthRecord.create({
        data: {
          farmId,
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

  listMortalities(farmId: string) {
    return this.prisma.mortalityRecord.findMany({
      where: { farmId },
      include: { herdLot: true },
      orderBy: { date: 'desc' },
    });
  }

  async createMortality(farmId: string, dto: CreateMortalityDto) {
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

      return tx.mortalityRecord.create({
        data: {
          farmId,
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
