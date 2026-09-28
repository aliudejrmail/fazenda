import { Module } from '@nestjs/common';
import { FeedingService } from './feeding.service';
import { FeedingController } from './feeding.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [FeedingController],
  providers: [FeedingService, FarmGuard],
  exports: [FeedingService],
})
export class FeedingModule {}
