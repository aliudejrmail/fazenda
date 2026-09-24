import { Module } from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { VaccinesController } from './vaccines.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [VaccinesController],
  providers: [VaccinesService, FarmGuard],
})
export class VaccinesModule {}
