import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(farmId: string, from?: string, to?: string) {
    const now = new Date();
    const startOfMonth = from
      ? new Date(from)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = to
      ? new Date(to)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [
      lots,
      births,
      mortalities,
      culls,
      expenses,
      revenues,
      upcomingVaccines,
      allCampaigns,
      lowStock,
      weighings,
      replacements,
    ] = await Promise.all([
      this.prisma.herdLot.findMany({
        where: { farmId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      this.prisma.birthRecord.findMany({
        where: { farmId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      this.prisma.mortalityRecord.findMany({
        where: { farmId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      this.prisma.cullRecord.findMany({
        where: { farmId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      this.prisma.expense.findMany({
        where: {
          farmId,
          deletedAt: null,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.revenue.findMany({
        where: {
          farmId,
          deletedAt: null,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.vaccinationCampaign.findMany({
        where: { farmId, nextDueDate: { gte: now } },
        include: { vaccine: true, herdLot: true },
        orderBy: { nextDueDate: 'asc' },
        take: 10,
      }),
      this.prisma.vaccinationCampaign.findMany({
        where: { farmId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      this.prisma.inventoryItem.findMany({
        where: { farmId, deletedAt: null },
      }),
      this.prisma.lotWeighing.findMany({
        where: { farmId, date: { gte: threeMonthsAgo } },
        include: { herdLot: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.replacementRecord.findMany({
        where: { farmId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
    ]);

    const activeLots = lots.filter((l) => l.status === 'ATIVO');
    const byCategory: Record<string, number> = {};
    const bySystem: Record<string, number> = {};
    let totalHeads = 0;
    for (const lot of activeLots) {
      totalHeads += lot.quantity;
      byCategory[lot.category] =
        (byCategory[lot.category] ?? 0) + lot.quantity;
      bySystem[lot.system] = (bySystem[lot.system] ?? 0) + lot.quantity;
    }

    const matricesParidas = births.reduce((s, b) => s + b.matricesParidas, 0);
    const bezerros = births.reduce((s, b) => s + b.bezerros, 0);
    const bezerras = births.reduce((s, b) => s + b.bezerras, 0);
    const deaths = mortalities.reduce((s, m) => s + m.quantity, 0);
    const discarded = culls.reduce((s, c) => s + c.quantity, 0);
    const replaced = replacements.reduce((s, r) => s + r.quantity, 0);
    const mortalityRate =
      totalHeads + deaths > 0
        ? (deaths / (totalHeads + deaths)) * 100
        : 0;

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalRevenues = revenues.reduce((s, r) => s + Number(r.amount), 0);

    const lowStockItems = lowStock.filter(
      (i) => Number(i.quantity) <= Number(i.minQuantity),
    );

    const matrizes = byCategory.MATRIZ ?? 0;
    const youngHeads =
      (byCategory.BEZERRO ?? 0) +
      (byCategory.BEZERRA ?? 0) +
      (byCategory.NOVILHA ?? 0) +
      (byCategory.GARROTE ?? 0);

    const pregnancyRate =
      matrizes > 0
        ? Math.min(100, Number(((matricesParidas / matrizes) * 100).toFixed(1)))
        : 0;

    const gmdByLot = this.computeGmdByLot(weighings);
    const avgGmd =
      gmdByLot.length > 0
        ? Number(
            (
              gmdByLot.reduce((s, g) => s + g.gmd, 0) / gmdByLot.length
            ).toFixed(2),
          )
        : 0;

    const weightEvolution = this.computeWeightEvolution(weighings);

    const byCategoryStacked = Object.entries(byCategory).map(
      ([category, total]) => {
        const cria = activeLots
          .filter((l) => l.category === category && l.system === 'CRIA')
          .reduce((s, l) => s + l.quantity, 0);
        const recria = activeLots
          .filter((l) => l.category === category && l.system === 'RECRIA')
          .reduce((s, l) => s + l.quantity, 0);
        const confin = activeLots
          .filter((l) => l.category === category && l.system === 'CONFINAMENTO')
          .reduce((s, l) => s + l.quantity, 0);
        return { category, total, cria, recria, confin };
      },
    );

    const criticalAlerts =
      lowStockItems.length +
      upcomingVaccines.filter((v) => {
        if (!v.nextDueDate) return false;
        const days =
          (v.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return days <= 7;
      }).length +
      (deaths > 0 ? 1 : 0);

    const pendencies = this.buildPendencies(
      upcomingVaccines,
      lowStockItems,
      culls,
      now,
    );

    const lotControl = activeLots.map((lot) => {
      const days = Math.max(
        1,
        Math.floor(
          (now.getTime() - new Date(lot.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      const density = Number((lot.quantity / Math.max(days / 30, 1)).toFixed(1));
      return {
        id: lot.id,
        name: lot.name,
        category: lot.category,
        system: lot.system,
        status: lot.status,
        quantity: lot.quantity,
        daysInLot: days,
        densityHint: density,
      };
    });

    return {
      totalHeads,
      youngHeads,
      pregnancyRate,
      avgGmd,
      criticalAlerts,
      byCategory,
      bySystem,
      byCategoryStacked,
      reproductivePipeline: [
        { stage: 'Matrizes aptas', value: matrizes },
        {
          stage: 'Reposição (mês)',
          value: replaced,
        },
        { stage: 'Paridas (mês)', value: matricesParidas },
        { stage: 'Nascidos (mês)', value: bezerros + bezerras },
        { stage: 'Descarte (mês)', value: discarded },
      ],
      healthOccurrences: [
        { type: 'Vacinas', value: allCampaigns.reduce((s, c) => s + c.doses, 0) },
        { type: 'Mortalidade', value: deaths },
        { type: 'Descarte', value: discarded },
        {
          type: 'Partos',
          value: matricesParidas,
        },
      ],
      weightEvolution,
      gmdByLot,
      lotControl,
      lots: activeLots.map((l) => ({
        id: l.id,
        name: l.name,
        category: l.category,
        system: l.system,
        status: l.status,
        quantity: l.quantity,
      })),
      month: {
        matricesParidas,
        bezerros,
        bezerras,
        weanings: bezerros + bezerras,
        deaths,
        discarded,
        mortalityRate: Number(mortalityRate.toFixed(2)),
        totalExpenses,
        totalRevenues,
        result: totalRevenues - totalExpenses,
      },
      upcomingVaccines,
      pendencies,
      lowStockCount: lowStockItems.length,
      period: {
        from: startOfMonth.toISOString(),
        to: endOfMonth.toISOString(),
      },
    };
  }

  private computeGmdByLot(
    weighings: Array<{
      herdLotId: string;
      date: Date;
      avgWeightKg: unknown;
      herdLot: { name: string } | null;
    }>,
  ) {
    const byLot = new Map<
      string,
      Array<{ date: Date; weight: number; name: string }>
    >();

    for (const w of weighings) {
      const list = byLot.get(w.herdLotId) ?? [];
      list.push({
        date: w.date,
        weight: Number(w.avgWeightKg),
        name: w.herdLot?.name ?? 'Lote',
      });
      byLot.set(w.herdLotId, list);
    }

    const result: Array<{ lotId: string; lotName: string; gmd: number }> = [];
    for (const [lotId, list] of byLot) {
      if (list.length < 2) continue;
      list.sort((a, b) => a.date.getTime() - b.date.getTime());
      const first = list[0];
      const last = list[list.length - 1];
      const days =
        (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);
      if (days <= 0) continue;
      const gmd = Number(((last.weight - first.weight) / days).toFixed(2));
      result.push({ lotId, lotName: last.name, gmd });
    }
    return result.sort((a, b) => b.gmd - a.gmd);
  }

  private computeWeightEvolution(
    weighings: Array<{ date: Date; avgWeightKg: unknown }>,
  ) {
    const byMonth = new Map<string, number[]>();
    for (const w of weighings) {
      const key = `${w.date.getFullYear()}-${String(w.date.getMonth() + 1).padStart(2, '0')}`;
      const list = byMonth.get(key) ?? [];
      list.push(Number(w.avgWeightKg));
      byMonth.set(key, list);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, weights]) => ({
        month,
        avgWeightKg: Number(
          (weights.reduce((s, n) => s + n, 0) / weights.length).toFixed(1),
        ),
      }));
  }

  private buildPendencies(
    vaccines: Array<{
      id: string;
      nextDueDate: Date | null;
      vaccine: { name: string } | null;
      herdLot: { name: string } | null;
    }>,
    lowStock: Array<{ id: string; name: string }>,
    culls: Array<{ id: string; quantity: number; date: Date }>,
    now: Date,
  ) {
    const items: Array<{
      id: string;
      type: string;
      target: string;
      dueDate: string;
      status: 'ATRASADA' | 'PENDENTE' | 'CRITICO';
    }> = [];

    for (const v of vaccines) {
      if (!v.nextDueDate) continue;
      const days =
        (v.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      let status: 'ATRASADA' | 'PENDENTE' | 'CRITICO' = 'PENDENTE';
      if (days < 0) status = 'ATRASADA';
      else if (days <= 3) status = 'CRITICO';
      items.push({
        id: v.id,
        type: 'Vacina',
        target: `${v.vaccine?.name ?? 'Vacina'}${v.herdLot ? ` — ${v.herdLot.name}` : ''}`,
        dueDate: v.nextDueDate.toISOString(),
        status,
      });
    }

    for (const item of lowStock.slice(0, 5)) {
      items.push({
        id: `stock-${item.id}`,
        type: 'Estoque',
        target: item.name,
        dueDate: now.toISOString(),
        status: 'CRITICO',
      });
    }

    if (culls.length > 0) {
      const qty = culls.reduce((s, c) => s + c.quantity, 0);
      items.push({
        id: 'cull-month',
        type: 'Descarte',
        target: `${qty} cabeças no período`,
        dueDate: now.toISOString(),
        status: 'PENDENTE',
      });
    }

    return items.slice(0, 8);
  }
}
