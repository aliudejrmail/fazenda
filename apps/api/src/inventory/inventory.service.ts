import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async createMovement(farmId: string, dto: CreateStockMovementDto) {
    return this.prisma.$transaction(async (tx) => {
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
          throw new BadRequestException('Estoque insuficiente');
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
    });
  }
}
