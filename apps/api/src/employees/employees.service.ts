import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  CreatePayrollDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  list(farmId: string) {
    return this.prisma.employee.findMany({
      where: { farmId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  create(farmId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        farmId,
        name: dto.name,
        role: dto.role,
        phone: dto.phone,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
        salary: dto.salary,
        notes: dto.notes,
      },
    });
  }

  async update(farmId: string, id: string, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, farmId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  listPayroll(farmId: string) {
    return this.prisma.payrollEntry.findMany({
      where: { farmId },
      include: { employee: true },
      orderBy: { date: 'desc' },
    });
  }

  async createPayroll(farmId: string, dto: CreatePayrollDto) {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id: dto.employeeId, farmId, deletedAt: null },
      });
      if (!employee) throw new NotFoundException('Funcionário não encontrado');

      const entry = await tx.payrollEntry.create({
        data: {
          farmId,
          employeeId: dto.employeeId,
          referenceMonth: new Date(dto.referenceMonth),
          date: new Date(dto.date),
          amount: dto.amount,
          description: dto.description ?? `Folha — ${employee.name}`,
        },
        include: { employee: true },
      });

      await tx.expense.create({
        data: {
          farmId,
          costCenter: 'RH',
          description: entry.description ?? `Folha — ${employee.name}`,
          amount: dto.amount,
          date: new Date(dto.date),
        },
      });

      return entry;
    });
  }
}
