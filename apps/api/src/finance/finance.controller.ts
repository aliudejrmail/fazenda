import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  CreateRevenueDto,
} from './dto/finance.dto';

@ApiTags('finance')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('categories')
  listCategories(@FarmId() farmId: string) {
    return this.financeService.listCategories(farmId);
  }

  @Post('categories')
  createCategory(
    @FarmId() farmId: string,
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    return this.financeService.createCategory(farmId, dto);
  }

  @Get('expenses')
  listExpenses(
    @FarmId() farmId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.listExpenses(farmId, from, to);
  }

  @Post('expenses')
  createExpense(@FarmId() farmId: string, @Body() dto: CreateExpenseDto) {
    return this.financeService.createExpense(farmId, dto);
  }

  @Delete('expenses/:id')
  removeExpense(@FarmId() farmId: string, @Param('id') id: string) {
    return this.financeService.removeExpense(farmId, id);
  }

  @Get('revenues')
  listRevenues(
    @FarmId() farmId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.listRevenues(farmId, from, to);
  }

  @Post('revenues')
  createRevenue(@FarmId() farmId: string, @Body() dto: CreateRevenueDto) {
    return this.financeService.createRevenue(farmId, dto);
  }

  @Delete('revenues/:id')
  removeRevenue(@FarmId() farmId: string, @Param('id') id: string) {
    return this.financeService.removeRevenue(farmId, id);
  }

  @Get('result')
  periodResult(
    @FarmId() farmId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.periodResult(farmId, from, to);
  }
}
