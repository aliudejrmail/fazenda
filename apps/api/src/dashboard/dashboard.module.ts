import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, FarmGuard],
})
export class DashboardModule {}
