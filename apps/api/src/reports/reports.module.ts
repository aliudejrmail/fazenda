import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, FarmGuard],
})
export class ReportsModule {}
