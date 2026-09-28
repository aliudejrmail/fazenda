import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFeedAssignmentDto,
  CreateFeedDietDto,
  CreateFeedRecordDto,
  DietIngredientDto,
  SetDietIngredientsDto,
  UpdateFeedDietDto,
} from './dto/feeding.dto';

const dietInclude = {
  ingredients: {
    include: {
      inventoryItem: {
        select: {
          id: true,
          name: true,
          unit: true,
          quantity: true,
          avgUnitCost: true,
          category: true,
        },
      },
    },
    orderBy: { percent: 'desc' as const },
  },
};

@Injectable()
export class FeedingService {
  constructor(private readonly prisma: PrismaService) {}

  listDiets(farmId: string) {
    return this.prisma.feedDiet.findMany({
      where: { farmId, deletedAt: null },
      include: dietInclude,
      orderBy: { name: 'asc' },
    });
  }

  async getDiet(farmId: string, id: string) {
    const diet = await this.prisma.feedDiet.findFirst({
      where: { id, farmId, deletedAt: null },
      include: dietInclude,
    });
    if (!diet) throw new NotFoundException('Dieta não encontrada');
    return diet;
  }

  async createDiet(farmId: string, dto: CreateFeedDietDto) {
    if (dto.ingredients?.length) {
      this.assertPercentSum(dto.ingredients);
      await this.assertInventoryItems(farmId, dto.ingredients);
    }

    return this.prisma.feedDiet.create({
      data: {
        farmId,
        name: dto.name,
        description: dto.description,
        kgPerAnimal: dto.kgPerAnimal,
        active: dto.active ?? true,
        ingredients: dto.ingredients?.length
          ? {
              create: dto.ingredients.map((i) => ({
                inventoryItemId: i.inventoryItemId,
                percent: i.percent,
              })),
            }
          : undefined,
      },
      include: dietInclude,
    });
  }

  async updateDiet(farmId: string, id: string, dto: UpdateFeedDietDto) {
    await this.getDiet(farmId, id);
    return this.prisma.feedDiet.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        kgPerAnimal: dto.kgPerAnimal,
        active: dto.active,
      },
      include: dietInclude,
    });
  }

  async setIngredients(
    farmId: string,
    dietId: string,
    dto: SetDietIngredientsDto,
  ) {
    await this.getDiet(farmId, dietId);
    this.assertPercentSum(dto.ingredients);
    await this.assertInventoryItems(farmId, dto.ingredients);

    return this.prisma.$transaction(async (tx) => {
      await tx.feedDietIngredient.deleteMany({ where: { dietId } });
      await tx.feedDietIngredient.createMany({
        data: dto.ingredients.map((i) => ({
          dietId,
          inventoryItemId: i.inventoryItemId,
          percent: i.percent,
        })),
      });
      return tx.feedDiet.findUniqueOrThrow({
        where: { id: dietId },
        include: dietInclude,
      });
    });
  }

  async removeDiet(farmId: string, id: string) {
    await this.getDiet(farmId, id);
    return this.prisma.feedDiet.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  }

  listAssignments(farmId: string, activeOnly = true) {
    return this.prisma.feedAssignment.findMany({
      where: {
        farmId,
        ...(activeOnly ? { endDate: null } : {}),
      },
      include: {
        herdLot: { select: { id: true, name: true, quantity: true } },
        diet: { select: { id: true, name: true, kgPerAnimal: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async assignDiet(farmId: string, dto: CreateFeedAssignmentDto) {
    const lot = await this.prisma.herdLot.findFirst({
      where: { id: dto.herdLotId, farmId, deletedAt: null },
    });
    if (!lot) throw new NotFoundException('Lote não encontrado');

    const diet = await this.getDiet(farmId, dto.dietId);
    if (!diet.active) {
      throw new BadRequestException('Dieta inativa');
    }
    if (diet.ingredients.length === 0) {
      throw new BadRequestException('Dieta sem ingredientes');
    }

    const startDate = new Date(dto.startDate);

    return this.prisma.$transaction(async (tx) => {
      await tx.feedAssignment.updateMany({
        where: { farmId, herdLotId: dto.herdLotId, endDate: null },
        data: { endDate: startDate },
      });

      return tx.feedAssignment.create({
        data: {
          farmId,
          herdLotId: dto.herdLotId,
          dietId: dto.dietId,
          startDate,
          kgPerAnimal: dto.kgPerAnimal,
        },
        include: {
          herdLot: { select: { id: true, name: true, quantity: true } },
          diet: { select: { id: true, name: true, kgPerAnimal: true } },
        },
      });
    });
  }

  listRecords(farmId: string, herdLotId?: string) {
    return this.prisma.feedRecord.findMany({
      where: {
        farmId,
        ...(herdLotId ? { herdLotId } : {}),
      },
      include: {
        herdLot: { select: { id: true, name: true } },
        diet: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  async createRecord(farmId: string, dto: CreateFeedRecordDto) {
    const lot = await this.prisma.herdLot.findFirst({
      where: { id: dto.herdLotId, farmId, deletedAt: null },
    });
    if (!lot) throw new NotFoundException('Lote não encontrado');

    let dietId = dto.dietId;
    let kgOverride: number | null = null;

    if (!dietId) {
      const assignment = await this.prisma.feedAssignment.findFirst({
        where: { farmId, herdLotId: dto.herdLotId, endDate: null },
        orderBy: { startDate: 'desc' },
      });
      if (!assignment) {
        throw new BadRequestException(
          'Lote sem dieta atribuída. Informe a dieta ou atribua uma antes.',
        );
      }
      dietId = assignment.dietId;
      kgOverride =
        assignment.kgPerAnimal != null ? Number(assignment.kgPerAnimal) : null;
    }

    const diet = await this.getDiet(farmId, dietId);
    if (diet.ingredients.length === 0) {
      throw new BadRequestException('Dieta sem ingredientes');
    }

    const animals = dto.animals ?? lot.quantity;
    if (animals < 1) {
      throw new BadRequestException('Quantidade de animais inválida');
    }

    const kgPerAnimal =
      dto.kgPerAnimal ??
      kgOverride ??
      Number(diet.kgPerAnimal);

    if (kgPerAnimal <= 0) {
      throw new BadRequestException('kg/animal deve ser maior que zero');
    }

    const totalKg = new Prisma.Decimal(animals).mul(kgPerAnimal);
    const date = new Date(dto.date);

    return this.prisma.$transaction(async (tx) => {
      let totalCost = new Prisma.Decimal(0);
      const deductions: Array<{
        itemId: string;
        itemName: string;
        qty: Prisma.Decimal;
        unitCost: Prisma.Decimal;
        lineCost: Prisma.Decimal;
      }> = [];

      for (const ing of diet.ingredients) {
        const item = await tx.inventoryItem.findFirst({
          where: {
            id: ing.inventoryItemId,
            farmId,
            deletedAt: null,
          },
        });
        if (!item) {
          throw new NotFoundException(
            `Insumo da dieta não encontrado: ${ing.inventoryItemId}`,
          );
        }

        const qty = totalKg.mul(ing.percent).div(100);
        const stock = new Prisma.Decimal(item.quantity);
        if (stock.lt(qty)) {
          throw new BadRequestException(
            `Estoque insuficiente de ${item.name}: precisa ${qty.toFixed(3)} ${item.unit}, tem ${stock.toFixed(3)}`,
          );
        }

        const unitCost = new Prisma.Decimal(item.avgUnitCost);
        const lineCost = unitCost.mul(qty);
        totalCost = totalCost.add(lineCost);
        deductions.push({
          itemId: item.id,
          itemName: item.name,
          qty,
          unitCost,
          lineCost,
        });
      }

      const costPerKg = totalKg.gt(0)
        ? totalCost.div(totalKg)
        : new Prisma.Decimal(0);
      const costPerAnimal = totalCost.div(animals);

      const record = await tx.feedRecord.create({
        data: {
          farmId,
          herdLotId: dto.herdLotId,
          dietId: diet.id,
          date,
          animals,
          kgPerAnimal,
          totalKg,
          totalCost,
          costPerKg,
          costPerAnimal,
          notes: dto.notes,
        },
      });

      for (const d of deductions) {
        await tx.inventoryItem.update({
          where: { id: d.itemId },
          data: { quantity: { decrement: d.qty } },
        });

        await tx.stockMovement.create({
          data: {
            farmId,
            itemId: d.itemId,
            type: 'SAIDA',
            quantity: d.qty,
            unitCost: d.unitCost,
            totalCost: d.lineCost,
            date,
            notes: `Alimentação: ${lot.name} / ${diet.name}`,
            feedRecordId: record.id,
          },
        });
      }

      return tx.feedRecord.findUniqueOrThrow({
        where: { id: record.id },
        include: {
          herdLot: { select: { id: true, name: true } },
          diet: { select: { id: true, name: true } },
          stockMovements: {
            include: {
              item: { select: { id: true, name: true, unit: true } },
            },
          },
        },
      });
    });
  }

  async summary(farmId: string, from?: string, to?: string) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const records = await this.prisma.feedRecord.findMany({
      where: {
        farmId,
        ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
      },
      include: {
        herdLot: { select: { id: true, name: true } },
        diet: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalKg = records.reduce(
      (acc, r) => acc + Number(r.totalKg),
      0,
    );
    const totalCost = records.reduce(
      (acc, r) => acc + Number(r.totalCost),
      0,
    );
    const totalAnimalsDay = records.reduce((acc, r) => acc + r.animals, 0);

    const byLotMap = new Map<
      string,
      {
        herdLotId: string;
        herdLotName: string;
        totalKg: number;
        totalCost: number;
        records: number;
      }
    >();

    for (const r of records) {
      const cur = byLotMap.get(r.herdLotId) ?? {
        herdLotId: r.herdLotId,
        herdLotName: r.herdLot.name,
        totalKg: 0,
        totalCost: 0,
        records: 0,
      };
      cur.totalKg += Number(r.totalKg);
      cur.totalCost += Number(r.totalCost);
      cur.records += 1;
      byLotMap.set(r.herdLotId, cur);
    }

    const lowStock = await this.prisma.inventoryItem.findMany({
      where: {
        farmId,
        deletedAt: null,
        category: { in: ['RACAO', 'INSUMO'] },
      },
      orderBy: { name: 'asc' },
    });

    return {
      totals: {
        records: records.length,
        totalKg: Number(totalKg.toFixed(3)),
        totalCost: Number(totalCost.toFixed(2)),
        avgCostPerKg:
          totalKg > 0 ? Number((totalCost / totalKg).toFixed(4)) : null,
        avgCostPerAnimalDay:
          totalAnimalsDay > 0
            ? Number((totalCost / totalAnimalsDay).toFixed(4))
            : null,
      },
      byLot: Array.from(byLotMap.values()).map((l) => ({
        ...l,
        totalKg: Number(l.totalKg.toFixed(3)),
        totalCost: Number(l.totalCost.toFixed(2)),
        costPerKg:
          l.totalKg > 0 ? Number((l.totalCost / l.totalKg).toFixed(4)) : null,
      })),
      lowStock: lowStock
        .filter((i) => Number(i.quantity) <= Number(i.minQuantity))
        .map((i) => ({
          id: i.id,
          name: i.name,
          quantity: Number(i.quantity),
          minQuantity: Number(i.minQuantity),
          unit: i.unit,
        })),
      recent: records.slice(0, 20).map((r) => ({
        id: r.id,
        date: r.date,
        herdLotId: r.herdLotId,
        herdLotName: r.herdLot.name,
        dietName: r.diet.name,
        animals: r.animals,
        totalKg: Number(r.totalKg),
        totalCost: Number(r.totalCost),
        costPerKg: Number(r.costPerKg),
        costPerAnimal: Number(r.costPerAnimal),
      })),
    };
  }

  private assertPercentSum(ingredients: DietIngredientDto[]) {
    const sum = ingredients.reduce((acc, i) => acc + Number(i.percent), 0);
    if (Math.abs(sum - 100) > 0.05) {
      throw new BadRequestException(
        `A soma dos percentuais deve ser 100% (atual: ${sum.toFixed(2)}%)`,
      );
    }
    const ids = ingredients.map((i) => i.inventoryItemId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Insumo duplicado na dieta');
    }
  }

  private async assertInventoryItems(
    farmId: string,
    ingredients: DietIngredientDto[],
  ) {
    const ids = ingredients.map((i) => i.inventoryItemId);
    const items = await this.prisma.inventoryItem.findMany({
      where: { farmId, deletedAt: null, id: { in: ids } },
      select: { id: true },
    });
    if (items.length !== ids.length) {
      throw new BadRequestException(
        'Um ou mais insumos não pertencem a esta fazenda',
      );
    }
  }
}
