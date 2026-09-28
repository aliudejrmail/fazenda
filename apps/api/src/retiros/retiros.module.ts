import { Module } from '@nestjs/common';
import { RetirosService } from './retiros.service';
import { RetirosController } from './retiros.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [RetirosController],
  providers: [RetirosService, FarmGuard],
  exports: [RetirosService],
})
export class RetirosModule {}
