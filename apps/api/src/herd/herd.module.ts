import { Module } from '@nestjs/common';
import { HerdService } from './herd.service';
import { HerdController } from './herd.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [HerdController],
  providers: [HerdService, FarmGuard],
  exports: [HerdService],
})
export class HerdModule {}
