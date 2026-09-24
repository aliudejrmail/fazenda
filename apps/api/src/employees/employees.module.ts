import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, FarmGuard],
})
export class EmployeesModule {}
