import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  CreateRevenueDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories(farmId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { farmId },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(farmId: string, dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({
      data: { farmId, name: dto.name, costCenter: dto.costCenter },
    });
  }

  listExpenses(farmId: string, from?: string, to?: string) {
    return this.prisma.expense.findMany({
      where: {
        farmId,
        deletedAt: null,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  createExpense(farmId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        farmId,
        costCenter: dto.costCenter,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        categoryId: dto.categoryId,
        notes: dto.notes,
      },
    });
  }

  async removeExpense(farmId: string, id: string) {
    return this.prisma.expense.updateMany({
      where: { id, farmId },
      data: { deletedAt: new Date() },
    });
  }

  listRevenues(farmId: string, from?: string, to?: string) {
    return this.prisma.revenue.findMany({
      where: {
        farmId,
        deletedAt: null,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  createRevenue(farmId: string, dto: CreateRevenueDto) {
    return this.prisma.revenue.create({
      data: {
        farmId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        quantity: dto.quantity,
        weightArroba: dto.weightArroba,
        notes: dto.notes,
      },
    });
  }

  async removeRevenue(farmId: string, id: string) {
    return this.prisma.revenue.updateMany({
      where: { id, farmId },
      data: { deletedAt: new Date() },
    });
  }

  async periodResult(farmId: string, from?: string, to?: string) {
    const dateFilter =
      from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const [expenses, revenues] = await Promise.all([
      this.prisma.expense.findMany({
        where: { farmId, deletedAt: null, ...dateFilter },
      }),
      this.prisma.revenue.findMany({
        where: { farmId, deletedAt: null, ...dateFilter },
      }),
    ]);

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalRevenues = revenues.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );

    const byCostCenter: Record<string, number> = {};
    for (const e of expenses) {
      byCostCenter[e.costCenter] =
        (byCostCenter[e.costCenter] ?? 0) + Number(e.amount);
    }

    return {
      totalExpenses,
      totalRevenues,
      result: totalRevenues - totalExpenses,
      byCostCenter,
    };
  }
}
