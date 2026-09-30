import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertVehicleInFarm } from '../common/utils/farm-scope';
import {
  CreateFuelDto,
  CreateMaintenanceDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/fleet.dto';

const LINK_COUNT = {
  select: { fuelRecords: true, maintenances: true },
} satisfies Prisma.VehicleCountOutputTypeDefaultArgs;

type LinkCount = { fuelRecords: number; maintenances: number };

function describeLinks(count: LinkCount) {
  const parts: string[] = [];
  if (count.fuelRecords > 0) {
    parts.push(`${count.fuelRecords} abastecimento(s)`);
  }
  if (count.maintenances > 0) {
    parts.push(`${count.maintenances} manutenção(ões)`);
  }
  return parts.join(' e ');
}

function totalLinks(count: LinkCount) {
  return count.fuelRecords + count.maintenances;
}

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  async listVehicles(farmId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { farmId, deletedAt: null },
      include: { _count: LINK_COUNT },
      orderBy: { name: 'asc' },
    });
    return vehicles.map((v) => ({
      ...v,
      canDelete: totalLinks(v._count) === 0,
    }));
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
    await this.findOne(farmId, id);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  /**
   * Exclui apenas veículos sem abastecimento nem manutenção.
   * Com histórico, o caminho é inativar (PATCH `active: false`).
   */
  async removeVehicle(farmId: string, id: string) {
    const vehicle = await this.findOne(farmId, id);
    if (totalLinks(vehicle._count) > 0) {
      throw new ConflictException(
        `Não é possível excluir: o veículo possui ${describeLinks(vehicle._count)}. Inative-o para preservar o histórico.`,
      );
    }
    await this.prisma.vehicle.delete({ where: { id } });
    return { deleted: true };
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
      await assertVehicleInFarm(tx, farmId, dto.vehicleId, {
        requireActive: true,
      });
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
      await assertVehicleInFarm(tx, farmId, dto.vehicleId, {
        requireActive: true,
      });
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

  private async findOne(farmId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, farmId, deletedAt: null },
      include: { _count: LINK_COUNT },
    });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    return vehicle;
  }
}
