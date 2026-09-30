import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryItemDto,
  CreateStockMovementDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  listItems(farmId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { farmId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  createItem(farmId: string, dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({
      data: {
        farmId,
        name: dto.name,
        category: dto.category,
        unit: dto.unit,
        quantity: dto.quantity ?? 0,
        minQuantity: dto.minQuantity ?? 0,
        avgUnitCost: dto.avgUnitCost ?? 0,
      },
    });
  }

  listMovements(farmId: string) {
    return this.prisma.stockMovement.findMany({
      where: { farmId },
      include: { item: true },
      orderBy: { date: 'desc' },
    });
  }

  createMovement(farmId: string, dto: CreateStockMovementDto) {
    return this.prisma.$transaction((tx) =>
      this.applyMovement(tx, farmId, dto),
    );
  }

  /**
   * Aplica uma movimentação dentro de uma transação já aberta, para que
   * outros módulos (ex.: campanhas de vacinação) baixem estoque de forma atômica.
   */
  async applyMovement(
    tx: Prisma.TransactionClient,
    farmId: string,
    dto: CreateStockMovementDto,
    campaignId?: string,
  ) {
    const item = await tx.inventoryItem.findFirst({
      where: { id: dto.itemId, farmId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    const qty = new Prisma.Decimal(dto.quantity);
    let newQty = new Prisma.Decimal(item.quantity);
    let avgCost = new Prisma.Decimal(item.avgUnitCost);

    if (dto.type === 'ENTRADA') {
      const unitCost = new Prisma.Decimal(dto.unitCost ?? item.avgUnitCost);
      const totalValue = avgCost.mul(newQty).add(unitCost.mul(qty));
      newQty = newQty.add(qty);
      avgCost = newQty.gt(0) ? totalValue.div(newQty) : unitCost;
    } else if (dto.type === 'SAIDA') {
      if (newQty.lt(qty)) {
        throw new BadRequestException(
          `Estoque insuficiente de "${item.name}": ${newQty.toString()} ${item.unit} disponível(is).`,
        );
      }
      newQty = newQty.sub(qty);
    } else {
      newQty = qty;
    }

    await tx.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: newQty, avgUnitCost: avgCost },
    });

    const totalCost =
      dto.unitCost != null
        ? new Prisma.Decimal(dto.unitCost).mul(qty)
        : avgCost.mul(qty);

    const movement = await tx.stockMovement.create({
      data: {
        farmId,
        itemId: item.id,
        type: dto.type,
        quantity: qty,
        unitCost: dto.unitCost,
        totalCost,
        date: new Date(dto.date),
        notes: dto.notes,
        campaignId,
      },
      include: { item: true },
    });

    if (dto.type === 'ENTRADA' && dto.unitCost) {
      await tx.expense.create({
        data: {
          farmId,
          costCenter: 'ALMOXARIFADO',
          description: `Entrada estoque: ${item.name}`,
          amount: totalCost,
          date: new Date(dto.date),
        },
      });
    }

    return movement;
  }

  /**
   * Desfaz as baixas (SAIDA) geradas por uma campanha: devolve a quantidade
   * ao item e remove as movimentações. Usado ao editar ou excluir a campanha.
   */
  async revertCampaignMovements(
    tx: Prisma.TransactionClient,
    campaignId: string,
  ): Promise<boolean> {
    const movements = await tx.stockMovement.findMany({
      where: { campaignId, type: 'SAIDA' },
    });
    for (const m of movements) {
      await tx.inventoryItem.update({
        where: { id: m.itemId },
        data: { quantity: { increment: m.quantity } },
      });
    }
    await tx.stockMovement.deleteMany({ where: { campaignId } });
    return movements.length > 0;
  }
}
