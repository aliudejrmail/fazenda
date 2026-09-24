import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, FarmGuard],
  exports: [FinanceService],
})
export class FinanceModule {}
