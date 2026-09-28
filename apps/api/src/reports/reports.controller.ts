import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';

@ApiTags('reports')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  overview(
    @FarmId() farmId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.overview(farmId, from, to);
  }
}
