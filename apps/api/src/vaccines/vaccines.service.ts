import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, CreateVaccineDto } from './dto/vaccine.dto';

@Injectable()
export class VaccinesService {
  constructor(private readonly prisma: PrismaService) {}

  listVaccines(farmId: string) {
    return this.prisma.vaccine.findMany({
      where: { farmId },
      orderBy: { name: 'asc' },
    });
  }

  createVaccine(farmId: string, dto: CreateVaccineDto) {
    return this.prisma.vaccine.create({
      data: {
        farmId,
        name: dto.name,
        manufacturer: dto.manufacturer,
        notes: dto.notes,
      },
    });
  }

  listCampaigns(farmId: string) {
    return this.prisma.vaccinationCampaign.findMany({
      where: { farmId },
      include: { vaccine: true, herdLot: true },
      orderBy: { date: 'desc' },
    });
  }

  async createCampaign(farmId: string, dto: CreateCampaignDto) {
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.vaccinationCampaign.create({
        data: {
          farmId,
          vaccineId: dto.vaccineId,
          date: new Date(dto.date),
          doses: dto.doses,
          cost: dto.cost ?? 0,
          herdLotId: dto.herdLotId,
          nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
          notes: dto.notes,
        },
        include: { vaccine: true },
      });

      if (dto.cost && dto.cost > 0) {
        await tx.expense.create({
          data: {
            farmId,
            costCenter: 'SANIDADE',
            description: `Campanha vacinal: ${campaign.vaccine.name}`,
            amount: dto.cost,
            date: new Date(dto.date),
          },
        });
      }

      return campaign;
    });
  }

  upcoming(farmId: string) {
    const today = new Date();
    return this.prisma.vaccinationCampaign.findMany({
      where: {
        farmId,
        nextDueDate: { gte: today },
      },
      include: { vaccine: true, herdLot: true },
      orderBy: { nextDueDate: 'asc' },
      take: 20,
    });
  }
}
