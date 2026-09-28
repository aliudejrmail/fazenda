import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRetiroDto, UpdateRetiroDto } from './dto/retiro.dto';

@Injectable()
export class RetirosService {
  constructor(private readonly prisma: PrismaService) {}

  list(farmId: string) {
    return this.prisma.retiro.findMany({
      where: { farmId, deletedAt: null },
      include: {
        _count: { select: { herdLots: true } },
        herdLots: {
          where: { deletedAt: null, status: 'ATIVO' },
          select: { quantity: true, category: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(farmId: string, dto: CreateRetiroDto) {
    return this.prisma.retiro.create({
      data: {
        farmId,
        name: dto.name,
        notes: dto.notes,
        matricesPregnant: dto.matricesPregnant ?? 0,
        matricesEmpty: dto.matricesEmpty ?? 0,
      },
    });
  }

  async findOne(farmId: string, id: string) {
    const retiro = await this.prisma.retiro.findFirst({
      where: { id, farmId, deletedAt: null },
      include: {
        herdLots: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!retiro) throw new NotFoundException('Retiro não encontrado');
    return retiro;
  }

  async update(farmId: string, id: string, dto: UpdateRetiroDto) {
    await this.findOne(farmId, id);
    return this.prisma.retiro.update({
      where: { id },
      data: dto,
    });
  }

  async remove(farmId: string, id: string) {
    await this.findOne(farmId, id);
    await this.prisma.herdLot.updateMany({
      where: { farmId, retiroId: id },
      data: { retiroId: null },
    });
    return this.prisma.retiro.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async summary(farmId: string, id: string) {
    const retiro = await this.findOne(farmId, id);
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [births, mortalities] = await Promise.all([
      this.prisma.birthRecord.findMany({
        where: {
          farmId,
          OR: [{ retiroId: id }, { herdLot: { retiroId: id } }],
          date: { gte: startOfYear },
        },
      }),
      this.prisma.mortalityRecord.findMany({
        where: {
          farmId,
          OR: [{ retiroId: id }, { herdLot: { retiroId: id } }],
          date: { gte: startOfYear },
        },
      }),
    ]);

    const activeLots = retiro.herdLots.filter((l) => l.status === 'ATIVO');
    const byCategory: Record<string, number> = {};
    let totalHeads = 0;
    for (const lot of activeLots) {
      totalHeads += lot.quantity;
      byCategory[lot.category] =
        (byCategory[lot.category] ?? 0) + lot.quantity;
    }

    const matrices = byCategory.MATRIZ ?? 0;
    const touros = byCategory.TOURO ?? 0;
    const birthsYear = births.reduce(
      (s, b) => s + b.bezerros + b.bezerras,
      0,
    );
    const deathsYear = mortalities.reduce((s, m) => s + m.quantity, 0);
    const deathsByCategory: Record<string, number> = {};
    for (const m of mortalities) {
      const key = m.category ?? 'OUTROS';
      deathsByCategory[key] = (deathsByCategory[key] ?? 0) + m.quantity;
    }

    return {
      retiro: {
        id: retiro.id,
        name: retiro.name,
        notes: retiro.notes,
        matricesPregnant: retiro.matricesPregnant,
        matricesEmpty: retiro.matricesEmpty,
      },
      lots: retiro.herdLots,
      summary: {
        totalHeads,
        matrices,
        matricesPregnant: retiro.matricesPregnant,
        matricesEmpty: retiro.matricesEmpty,
        touros,
        birthsYear,
        deathsYear,
        byCategory,
        deathsByCategory,
      },
      recentBirths: births
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10),
      recentMortalities: mortalities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10),
    };
  }
}
