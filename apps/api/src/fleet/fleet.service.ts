import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFuelDto,
  CreateMaintenanceDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/fleet.dto';

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  listVehicles(farmId: string) {
    return this.prisma.vehicle.findMany({
      where: { farmId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  createVehicle(farmId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        farmId,
        name: dto.name,
        type: dto.type,
        plate: dto.plate,
        year: dto.year,
        notes: dto.notes,
      },
    });
  }

  async updateVehicle(farmId: string, id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, farmId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  listFuel(farmId: string) {
    return this.prisma.fuelRecord.findMany({
      where: { farmId },
      include: { vehicle: true },
      orderBy: { date: 'desc' },
    });
  }

  async createFuel(farmId: string, dto: CreateFuelDto) {
    const totalCost = new Prisma.Decimal(dto.liters).mul(dto.unitPrice);
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.fuelRecord.create({
        data: {
          farmId,
          vehicleId: dto.vehicleId,
          date: new Date(dto.date),
          liters: dto.liters,
          unitPrice: dto.unitPrice,
          totalCost,
          odometer: dto.odometer,
          notes: dto.notes,
        },
        include: { vehicle: true },
      });

      await tx.expense.create({
        data: {
          farmId,
          costCenter: 'FROTA',
          description: `Combustível: ${record.vehicle.name}`,
          amount: totalCost,
          date: new Date(dto.date),
        },
      });

      return record;
    });
  }

  listMaintenance(farmId: string) {
    return this.prisma.maintenanceRecord.findMany({
      where: { farmId },
      include: { vehicle: true },
      orderBy: { date: 'desc' },
    });
  }

  async createMaintenance(farmId: string, dto: CreateMaintenanceDto) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({
        data: {
          farmId,
          vehicleId: dto.vehicleId,
          date: new Date(dto.date),
          description: dto.description,
          cost: dto.cost,
          notes: dto.notes,
        },
        include: { vehicle: true },
      });

      await tx.expense.create({
        data: {
          farmId,
          costCenter: 'FROTA',
          description: `Manutenção: ${record.vehicle.name} — ${dto.description}`,
          amount: dto.cost,
          date: new Date(dto.date),
        },
      });

      return record;
    });
  }
}
