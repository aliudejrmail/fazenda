import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(farmId: string, from?: string, to?: string) {
    const now = new Date();
    const start = from
      ? new Date(from)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to
      ? new Date(to)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      lots,
      retiros,
      births,
      mortalities,
      culls,
      weighings,
      expenses,
      revenues,
      campaigns,
      feedRecords,
      diagnoses,
      inventory,
    ] = await Promise.all([
      this.prisma.herdLot.findMany({
        where: { farmId, deletedAt: null, status: 'ATIVO' },
        include: { retiro: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.retiro.findMany({
        where: { farmId, deletedAt: null, active: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.birthRecord.findMany({
        where: { farmId, date: { gte: start, lte: end } },
      }),
      this.prisma.mortalityRecord.findMany({
        where: { farmId, date: { gte: start, lte: end } },
      }),
      this.prisma.cullRecord.findMany({
        where: { farmId, date: { gte: start, lte: end } },
      }),
      this.prisma.lotWeighing.findMany({
        where: { farmId, date: { gte: start, lte: end } },
        include: { herdLot: { select: { id: true, name: true } } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: {
          farmId,
          deletedAt: null,
          date: { gte: start, lte: end },
        },
      }),
      this.prisma.revenue.findMany({
        where: {
          farmId,
          deletedAt: null,
          date: { gte: start, lte: end },
        },
      }),
      this.prisma.vaccinationCampaign.findMany({
        where: { farmId, date: { gte: start, lte: end } },
        include: {
          vaccine: { select: { name: true } },
          herdLot: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.feedRecord.findMany({
        where: { farmId, date: { gte: start, lte: end } },
        include: {
          herdLot: { select: { name: true } },
          diet: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.pregnancyDiagnosis.findMany({
        where: { farmId, date: { gte: start, lte: end } },
        include: {
          retiro: { select: { name: true } },
          herdLot: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.inventoryItem.findMany({
        where: { farmId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
    ]);

    const totalHeads = lots.reduce((s, l) => s + l.quantity, 0);
    const pregnant = retiros.reduce((s, r) => s + r.matricesPregnant, 0);
    const empty = retiros.reduce((s, r) => s + r.matricesEmpty, 0);
    const diagnosed = pregnant + empty;

    const gmdByLot = this.computeGmd(weighings);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalRevenues = revenues.reduce((s, r) => s + Number(r.amount), 0);
    const feedKg = feedRecords.reduce((s, r) => s + Number(r.totalKg), 0);
    const feedCost = feedRecords.reduce((s, r) => s + Number(r.totalCost), 0);

    const expensesByCenter: Record<string, number> = {};
    for (const e of expenses) {
      expensesByCenter[e.costCenter] =
        (expensesByCenter[e.costCenter] ?? 0) + Number(e.amount);
    }

    return {
      period: { from: start.toISOString(), to: end.toISOString() },
      herd: {
        totalHeads,
        lots: lots.map((l) => ({
          id: l.id,
          name: l.name,
          category: l.category,
          system: l.system,
          quantity: l.quantity,
          retiro: l.retiro?.name ?? null,
        })),
        byCategory: this.groupSum(lots, 'category'),
        bySystem: this.groupSum(lots, 'system'),
        births: {
          matricesParidas: births.reduce((s, b) => s + b.matricesParidas, 0),
          bezerros: births.reduce((s, b) => s + b.bezerros, 0),
          bezerras: births.reduce((s, b) => s + b.bezerras, 0),
        },
        deaths: mortalities.reduce((s, m) => s + m.quantity, 0),
        discarded: culls.reduce((s, c) => s + c.quantity, 0),
      },
      pregnancy: {
        pregnant,
        empty,
        rate:
          diagnosed > 0
            ? Number(((pregnant / diagnosed) * 100).toFixed(1))
            : null,
        diagnoses: diagnoses.map((d) => ({
          id: d.id,
          date: d.date,
          pregnantCount: d.pregnantCount,
          emptyCount: d.emptyCount,
          method: d.method,
          retiro: d.retiro?.name ?? null,
          herdLot: d.herdLot?.name ?? null,
        })),
        byRetiro: retiros.map((r) => ({
          id: r.id,
          name: r.name,
          pregnant: r.matricesPregnant,
          empty: r.matricesEmpty,
          rate:
            r.matricesPregnant + r.matricesEmpty > 0
              ? Number(
                  (
                    (r.matricesPregnant /
                      (r.matricesPregnant + r.matricesEmpty)) *
                    100
                  ).toFixed(1),
                )
              : null,
        })),
      },
      gmd: {
        lots: gmdByLot,
        avgGmd:
          gmdByLot.length > 0
            ? Number(
                (
                  gmdByLot.reduce((s, g) => s + g.gmd, 0) / gmdByLot.length
                ).toFixed(3),
              )
            : null,
        weighings: weighings.map((w) => ({
          id: w.id,
          date: w.date,
          lot: w.herdLot.name,
          avgWeightKg: Number(w.avgWeightKg),
          quantity: w.quantity,
        })),
      },
      finance: {
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalRevenues: Number(totalRevenues.toFixed(2)),
        result: Number((totalRevenues - totalExpenses).toFixed(2)),
        expensesByCenter: Object.entries(expensesByCenter).map(
          ([costCenter, amount]) => ({
            costCenter,
            amount: Number(amount.toFixed(2)),
          }),
        ),
      },
      vaccines: campaigns.map((c) => ({
        id: c.id,
        date: c.date,
        vaccine: c.vaccine.name,
        lot: c.herdLot?.name ?? null,
        doses: c.doses,
        cost: Number(c.cost),
        nextDueDate: c.nextDueDate,
      })),
      feeding: {
        totalKg: Number(feedKg.toFixed(3)),
        totalCost: Number(feedCost.toFixed(2)),
        costPerKg:
          feedKg > 0 ? Number((feedCost / feedKg).toFixed(4)) : null,
        records: feedRecords.map((r) => ({
          id: r.id,
          date: r.date,
          lot: r.herdLot.name,
          diet: r.diet.name,
          animals: r.animals,
          totalKg: Number(r.totalKg),
          totalCost: Number(r.totalCost),
        })),
      },
      inventory: inventory.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: Number(i.quantity),
        minQuantity: Number(i.minQuantity),
        unit: i.unit,
        avgUnitCost: Number(i.avgUnitCost),
        low: Number(i.quantity) <= Number(i.minQuantity),
      })),
    };
  }

  private groupSum(
    lots: Array<{ category: string; system: string; quantity: number }>,
    key: 'category' | 'system',
  ) {
    const map: Record<string, number> = {};
    for (const l of lots) {
      map[l[key]] = (map[l[key]] ?? 0) + l.quantity;
    }
    return Object.entries(map).map(([name, quantity]) => ({ name, quantity }));
  }

  private computeGmd(
    weighings: Array<{
      herdLotId: string;
      date: Date;
      avgWeightKg: { toString(): string } | number;
      herdLot: { id: string; name: string };
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
        name: w.herdLot.name,
      });
      byLot.set(w.herdLotId, list);
    }

    const result: Array<{
      lotId: string;
      lotName: string;
      gmd: number;
      weighings: number;
    }> = [];

    for (const [lotId, list] of byLot) {
      if (list.length < 2) continue;
      list.sort((a, b) => a.date.getTime() - b.date.getTime());
      const first = list[0];
      const last = list[list.length - 1];
      const days =
        (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);
      if (days <= 0) continue;
      result.push({
        lotId,
        lotName: first.name,
        gmd: Number(((last.weight - first.weight) / days).toFixed(3)),
        weighings: list.length,
      });
    }
    return result;
  }
}
