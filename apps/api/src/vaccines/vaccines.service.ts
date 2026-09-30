import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccineDto, UpdateVaccineDto } from './dto/vaccine.dto';
import { patchDate, patchText } from './vaccine-utils';

@Injectable()
export class VaccinesService {
  constructor(private readonly prisma: PrismaService) {}

  async listVaccines(farmId: string) {
    const vaccines = await this.prisma.vaccine.findMany({
      where: { farmId },
      include: {
        _count: { select: { campaigns: true } },
        inventoryItem: true,
      },
      orderBy: { name: 'asc' },
    });
    return vaccines.map(({ inventoryItem: item, ...v }) => ({
      ...v,
      canDelete: v._count.campaigns === 0,
      // Estoque de doses vem do item do Almoxarifado (mesma regra de alerta dele)
      stock: item
        ? {
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            quantity: Number(item.quantity),
            minQuantity: Number(item.minQuantity),
            low: Number(item.quantity) <= Number(item.minQuantity),
          }
        : null,
    }));
  }

  createVaccine(farmId: string, dto: CreateVaccineDto) {
    return this.prisma.$transaction(async (tx) => {
      const inventoryItemId = await this.resolveInventoryItem(
        tx,
        farmId,
        dto.name,
        dto,
      );
      return tx.vaccine.create({
        data: {
          farmId,
          name: dto.name,
          manufacturer: patchText(dto.manufacturer) ?? null,
          batchNumber: patchText(dto.batchNumber) ?? null,
          expiryDate: patchDate(dto.expiryDate) ?? null,
          notes: patchText(dto.notes) ?? null,
          inventoryItemId: inventoryItemId ?? null,
        },
      });
    });
  }

  async updateVaccine(farmId: string, id: string, dto: UpdateVaccineDto) {
    const current = await this.findOne(farmId, id);
    if (current.inventoryItemId && dto.stockDoses != null) {
      throw new BadRequestException(
        'O estoque já é controlado pelo Almoxarifado. Ajuste a quantidade por lá.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const inventoryItemId = await this.resolveInventoryItem(
        tx,
        farmId,
        dto.name ?? current.name,
        dto,
      );
      return tx.vaccine.update({
        where: { id },
        data: {
          name: dto.name,
          manufacturer: patchText(dto.manufacturer),
          batchNumber: patchText(dto.batchNumber),
          expiryDate: patchDate(dto.expiryDate),
          notes: patchText(dto.notes),
          active: dto.active,
          inventoryItemId,
        },
      });
    });
  }

  /**
   * Exclui apenas vacinas sem campanhas. Com histórico, o caminho é
   * inativar (PATCH `active: false`).
   */
  async removeVaccine(farmId: string, id: string) {
    const vaccine = await this.findOne(farmId, id);
    const campaigns = await this.prisma.vaccinationCampaign.count({
      where: { vaccineId: vaccine.id },
    });
    if (campaigns > 0) {
      throw new ConflictException(
        `Não é possível excluir: a vacina possui ${campaigns} campanha(s). Inative-a para preservar o histórico.`,
      );
    }
    await this.prisma.vaccine.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Define qual item do Almoxarifado controla as doses:
   * `stockDoses` cria um item novo; `inventoryItemId` liga um existente
   * (`null` desliga). Retorna `undefined` quando nada deve mudar.
   */
  private async resolveInventoryItem(
    tx: Prisma.TransactionClient,
    farmId: string,
    vaccineName: string,
    dto: Pick<
      CreateVaccineDto,
      'inventoryItemId' | 'stockDoses' | 'minStockDoses'
    >,
  ): Promise<string | null | undefined> {
    if (dto.stockDoses != null) {
      if (dto.inventoryItemId) {
        throw new BadRequestException(
          'Escolha um item existente do Almoxarifado ou informe o estoque inicial, não os dois.',
        );
      }
      const created = await tx.inventoryItem.create({
        data: {
          farmId,
          name: `Vacina: ${vaccineName}`,
          category: 'MEDICAMENTO',
          unit: 'dose',
          quantity: dto.stockDoses,
          minQuantity: dto.minStockDoses ?? 0,
        },
      });
      return created.id;
    }

    if (dto.inventoryItemId === undefined) return undefined;
    if (!dto.inventoryItemId) return null;

    const item = await tx.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, farmId, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException('Item do Almoxarifado não encontrado');
    }
    return item.id;
  }

  private async findOne(farmId: string, id: string) {
    const vaccine = await this.prisma.vaccine.findFirst({
      where: { id, farmId },
    });
    if (!vaccine) throw new NotFoundException('Vacina não encontrada');
    return vaccine;
  }
}
