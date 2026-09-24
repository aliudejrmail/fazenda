import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto, UpdateFarmDto } from './dto/farm.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFarmDto) {
    return this.prisma.farm.create({
      data: {
        name: dto.name,
        city: dto.city,
        state: dto.state,
        memberships: {
          create: { userId, role: MembershipRole.OWNER },
        },
        expenseCategories: {
          create: [
            { name: 'Custos da propriedade', costCenter: 'PROPRIEDADE' },
            { name: 'Custos do confinamento', costCenter: 'CONFINAMENTO' },
            { name: 'Combustível', costCenter: 'FROTA' },
            { name: 'Manutenção de frota', costCenter: 'FROTA' },
            { name: 'Folha de pagamento', costCenter: 'RH' },
            { name: 'Almoxarifado', costCenter: 'ALMOXARIFADO' },
            { name: 'Sanidade / vacinas', costCenter: 'SANIDADE' },
          ],
        },
      },
      include: { memberships: true },
    });
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { farm: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships
      .filter((m) => !m.farm.deletedAt)
      .map((m) => ({
        ...m.farm,
        role: m.role,
      }));
  }

  async findOne(userId: string, farmId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_farmId: { userId, farmId } },
      include: { farm: true },
    });
    if (!membership || membership.farm.deletedAt) {
      throw new NotFoundException('Fazenda não encontrada');
    }
    return { ...membership.farm, role: membership.role };
  }

  async update(userId: string, farmId: string, dto: UpdateFarmDto) {
    await this.ensureOwnerOrManager(userId, farmId);
    return this.prisma.farm.update({
      where: { id: farmId },
      data: dto,
    });
  }

  async remove(userId: string, farmId: string) {
    await this.ensureOwner(userId, farmId);
    return this.prisma.farm.update({
      where: { id: farmId },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureOwner(userId: string, farmId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_farmId: { userId, farmId } },
    });
    if (!m || m.role !== MembershipRole.OWNER) {
      throw new ForbiddenException('Apenas o proprietário pode executar esta ação');
    }
  }

  private async ensureOwnerOrManager(userId: string, farmId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_farmId: { userId, farmId } },
    });
    if (!m || m.role === MembershipRole.VIEWER) {
      throw new ForbiddenException('Sem permissão');
    }
  }
}
