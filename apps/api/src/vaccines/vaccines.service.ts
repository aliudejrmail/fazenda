import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccineDto, UpdateVaccineDto } from './dto/vaccine.dto';
import { patchDate, patchText } from './vaccine-utils';

@Injectable()
export class VaccinesService {
  constructor(private readonly prisma: PrismaService) {}

  async listVaccines(farmId: string) {
    const vaccines = await this.prisma.vaccine.findMany({
      where: { farmId },
      include: { _count: { select: { campaigns: true } } },
      orderBy: { name: 'asc' },
    });
    return vaccines.map((v) => ({ ...v, canDelete: v._count.campaigns === 0 }));
  }

  createVaccine(farmId: string, dto: CreateVaccineDto) {
    return this.prisma.vaccine.create({
      data: {
        farmId,
        name: dto.name,
        manufacturer: patchText(dto.manufacturer) ?? null,
        batchNumber: patchText(dto.batchNumber) ?? null,
        expiryDate: patchDate(dto.expiryDate) ?? null,
        notes: patchText(dto.notes) ?? null,
      },
    });
  }

  async updateVaccine(farmId: string, id: string, dto: UpdateVaccineDto) {
    await this.findOne(farmId, id);
    return this.prisma.vaccine.update({
      where: { id },
      data: {
        name: dto.name,
        manufacturer: patchText(dto.manufacturer),
        batchNumber: patchText(dto.batchNumber),
        expiryDate: patchDate(dto.expiryDate),
        notes: patchText(dto.notes),
        active: dto.active,
      },
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

  private async findOne(farmId: string, id: string) {
    const vaccine = await this.prisma.vaccine.findFirst({
      where: { id, farmId },
    });
    if (!vaccine) throw new NotFoundException('Vacina não encontrada');
    return vaccine;
  }
}
