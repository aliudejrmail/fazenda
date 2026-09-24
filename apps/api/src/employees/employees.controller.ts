import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import {
  CreateEmployeeDto,
  CreatePayrollDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@ApiTags('employees')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('payroll')
  listPayroll(@FarmId() farmId: string) {
    return this.employeesService.listPayroll(farmId);
  }

  @Post('payroll')
  createPayroll(@FarmId() farmId: string, @Body() dto: CreatePayrollDto) {
    return this.employeesService.createPayroll(farmId, dto);
  }

  @Get()
  list(@FarmId() farmId: string) {
    return this.employeesService.list(farmId);
  }

  @Post()
  create(@FarmId() farmId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(farmId, dto);
  }

  @Patch(':id')
  update(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(farmId, id, dto);
  }
}
