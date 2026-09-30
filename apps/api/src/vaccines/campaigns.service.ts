import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/vaccine.dto';
import { patchDate, patchText } from './vaccine-utils';

const CAMPAIGN_INCLUDE = { vaccine: true, herdLot: true } as const;

type CampaignWithVaccine = Prisma.VaccinationCampaignGetPayload<{
  include: typeof CAMPAIGN_INCLUDE;
}>;

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  list(farmId: string) {
    return this.prisma.vaccinationCampaign.findMany({
      where: { farmId },
      include: CAMPAIGN_INCLUDE,
      orderBy: { date: 'desc' },
    });
  }

  upcoming(farmId: string) {
    return this.prisma.vaccinationCampaign.findMany({
      where: { farmId, nextDueDate: { gte: new Date() } },
      include: CAMPAIGN_INCLUDE,
      orderBy: { nextDueDate: 'asc' },
      take: 20,
    });
  }

  async create(farmId: string, dto: CreateCampaignDto) {
    const vaccine = await this.getVaccine(farmId, dto.vaccineId, true);
    // Sem lote/validade informados, herda os do cadastro da vacina
    const batchNumber = patchText(dto.batchNumber) ?? vaccine.batchNumber;
    const expiryDate = patchDate(dto.expiryDate) ?? vaccine.expiryDate;
    const date = new Date(dto.date);
    await this.assertRules(farmId, date, expiryDate, dto.herdLotId);

    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.vaccinationCampaign.create({
        data: {
          farmId,
          vaccineId: dto.vaccineId,
          date,
          doses: dto.doses,
          cost: dto.cost ?? 0,
          herdLotId: dto.herdLotId || null,
          nextDueDate: patchDate(dto.nextDueDate) ?? null,
          batchNumber,
          expiryDate,
          notes: patchText(dto.notes) ?? null,
        },
        include: CAMPAIGN_INCLUDE,
      });
      await this.consumeStock(tx, campaign);
      return this.syncExpense(tx, campaign);
    });
  }

  async update(farmId: string, id: string, dto: UpdateCampaignDto) {
    const current = await this.findOne(farmId, id);
    const vaccineChanged = !!dto.vaccineId && dto.vaccineId !== current.vaccineId;
    if (vaccineChanged) await this.getVaccine(farmId, dto.vaccineId!, true);

    const date = dto.date ? new Date(dto.date) : current.date;
    const expiryDate = patchDate(dto.expiryDate);
    const herdLotId =
      dto.herdLotId === undefined ? current.herdLotId : dto.herdLotId || null;
    await this.assertRules(
      farmId,
      date,
      expiryDate === undefined ? current.expiryDate : expiryDate,
      herdLotId,
    );

    return this.prisma.$transaction(async (tx) => {
      // Devolve as doses baixadas antes de recalcular (evita baixar duas vezes)
      const hadStockMovement = await this.inventory.revertCampaignMovements(
        tx,
        id,
      );
      const campaign = await tx.vaccinationCampaign.update({
        where: { id },
        data: {
          vaccineId: dto.vaccineId,
          date: dto.date ? date : undefined,
          doses: dto.doses,
          cost: dto.cost,
          herdLotId,
          nextDueDate: patchDate(dto.nextDueDate),
          batchNumber: patchText(dto.batchNumber),
          expiryDate,
          notes: patchText(dto.notes),
        },
        include: CAMPAIGN_INCLUDE,
      });
      // Campanhas antigas (sem baixa) só passam a baixar se trocarem de vacina
      if (hadStockMovement || vaccineChanged) {
        await this.consumeStock(tx, campaign);
      }
      return this.syncExpense(tx, campaign);
    });
  }

  async remove(farmId: string, id: string) {
    const current = await this.findOne(farmId, id);
    await this.prisma.$transaction(async (tx) => {
      await this.inventory.revertCampaignMovements(tx, id);
      await this.releaseExpense(tx, current.expenseId);
      await tx.vaccinationCampaign.delete({ where: { id } });
    });
    return { deleted: true };
  }

  private async findOne(farmId: string, id: string) {
    const campaign = await this.prisma.vaccinationCampaign.findFirst({
      where: { id, farmId },
      include: CAMPAIGN_INCLUDE,
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  private async getVaccine(
    farmId: string,
    id: string,
    requireActive: boolean,
  ) {
    const vaccine = await this.prisma.vaccine.findFirst({
      where: { id, farmId },
    });
    if (!vaccine) {
      throw new NotFoundException('Vacina não encontrada nesta fazenda');
    }
    if (requireActive && !vaccine.active) {
      throw new BadRequestException(
        'Esta vacina está inativa. Reative-a para usá-la em campanhas.',
      );
    }
    return vaccine;
  }

  private async assertRules(
    farmId: string,
    date: Date,
    expiryDate: Date | null,
    herdLotId?: string | null,
  ) {
    if (expiryDate && expiryDate.getTime() < date.getTime()) {
      throw new BadRequestException(
        'A vacina estava vencida na data da aplicação. Verifique a validade do lote.',
      );
    }
    if (herdLotId) {
      const lot = await this.prisma.herdLot.findFirst({
        where: { id: herdLotId, farmId, deletedAt: null },
      });
      if (!lot) {
        throw new BadRequestException('Lote inválido para esta fazenda');
      }
    }
  }

  /** Baixa as doses do item do Almoxarifado ligado à vacina (se houver). */
  private async consumeStock(
    tx: Prisma.TransactionClient,
    campaign: CampaignWithVaccine,
  ) {
    const itemId = campaign.vaccine.inventoryItemId;
    if (!itemId) return;
    await this.inventory.applyMovement(
      tx,
      campaign.farmId,
      {
        itemId,
        type: 'SAIDA',
        quantity: campaign.doses,
        date: campaign.date.toISOString(),
        notes: `Campanha vacinal: ${campaign.vaccine.name}`,
      },
      campaign.id,
    );
  }

  /**
   * Mantém a despesa de Sanidade alinhada ao custo da campanha:
   * cria, atualiza ou remove (soft delete) conforme o custo.
   */
  private async syncExpense(
    tx: Prisma.TransactionClient,
    campaign: CampaignWithVaccine,
  ) {
    const cost = Number(campaign.cost);
    if (cost <= 0) {
      await this.releaseExpense(tx, campaign.expenseId);
      return this.setExpenseId(tx, campaign.id, null);
    }

    const data = {
      amount: cost,
      date: campaign.date,
      description: `Campanha vacinal: ${campaign.vaccine.name}`,
    };
    if (campaign.expenseId) {
      const updated = await tx.expense.updateMany({
        where: { id: campaign.expenseId, farmId: campaign.farmId },
        data: { ...data, deletedAt: null },
      });
      if (updated.count > 0) return campaign;
    }
    const expense = await tx.expense.create({
      data: { farmId: campaign.farmId, costCenter: 'SANIDADE', ...data },
    });
    return this.setExpenseId(tx, campaign.id, expense.id);
  }

  private async releaseExpense(
    tx: Prisma.TransactionClient,
    expenseId?: string | null,
  ) {
    if (!expenseId) return;
    await tx.expense.updateMany({
      where: { id: expenseId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  private setExpenseId(
    tx: Prisma.TransactionClient,
    id: string,
    expenseId: string | null,
  ) {
    return tx.vaccinationCampaign.update({
      where: { id },
      data: { expenseId },
      include: CAMPAIGN_INCLUDE,
    });
  }
}
