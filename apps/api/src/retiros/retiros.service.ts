import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRetiroDto, UpdateRetiroDto } from './dto/retiro.dto';

/** Vínculos que impedem a exclusão (só é possível inativar). */
const LINK_COUNT = {
  select: {
    herdLots: { where: { deletedAt: null } },
    birthRecords: true,
    mortalityRecords: true,
    pregnancyDiagnoses: true,
  },
} satisfies Prisma.RetiroCountOutputTypeDefaultArgs;

type LinkCount = {
  herdLots: number;
  birthRecords: number;
  mortalityRecords: number;
  pregnancyDiagnoses: number;
};

const LINK_LABELS: Array<[keyof LinkCount, string]> = [
  ['herdLots', 'lote(s)'],
  ['birthRecords', 'nascimento(s)'],
  ['mortalityRecords', 'mortalidade(s)'],
  ['pregnancyDiagnoses', 'diagnóstico(s) de prenhez'],
];

function totalLinks(count: LinkCount) {
  return LINK_LABELS.reduce((sum, [key]) => sum + count[key], 0);
}

function describeLinks(count: LinkCount) {
  return LINK_LABELS.filter(([key]) => count[key] > 0)
    .map(([key, label]) => `${count[key]} ${label}`)
    .join(', ');
}

@Injectable()
export class RetirosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(farmId: string) {
    const retiros = await this.prisma.retiro.findMany({
      where: { farmId, deletedAt: null },
      include: {
        _count: LINK_COUNT,
        herdLots: {
          where: { deletedAt: null, status: 'ATIVO' },
          select: { quantity: true, category: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return retiros.map((r) => ({
      ...r,
      canDelete: totalLinks(r._count) === 0,
    }));
  }

  async create(farmId: string, dto: CreateRetiroDto) {
    try {
      return await this.prisma.retiro.create({
        data: {
          farmId,
          name: dto.name,
          notes: dto.notes,
          matricesPregnant: dto.matricesPregnant ?? 0,
          matricesEmpty: dto.matricesEmpty ?? 0,
        },
      });
    } catch (err) {
      this.rethrowDuplicate(err);
    }
  }

  async findOne(farmId: string, id: string) {
    const retiro = await this.prisma.retiro.findFirst({
      where: { id, farmId, deletedAt: null },
      include: {
        _count: LINK_COUNT,
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
    try {
      return await this.prisma.retiro.update({
        where: { id },
        data: dto,
      });
    } catch (err) {
      this.rethrowDuplicate(err);
    }
  }

  /**
   * Exclui apenas retiros sem lotes nem movimentações vinculadas.
   * Com histórico, o caminho é inativar (PATCH `active: false`).
   */
  async remove(farmId: string, id: string) {
    const retiro = await this.findOne(farmId, id);
    if (totalLinks(retiro._count) > 0) {
      throw new ConflictException(
        `Não é possível excluir: o retiro possui ${describeLinks(retiro._count)}. Inative-o para preservar o histórico.`,
      );
    }
    await this.prisma.retiro.delete({ where: { id } });
    return { deleted: true };
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
        active: retiro.active,
        canDelete: totalLinks(retiro._count) === 0,
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

  /** Traduz violação de `@@unique([farmId, name])` em erro 409 legível. */
  private rethrowDuplicate(err: unknown): never {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictException('Já existe um retiro com este nome');
    }
    throw err;
  }
}
