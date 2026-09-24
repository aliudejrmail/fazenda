import { Module } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [FleetController],
  providers: [FleetService, FarmGuard],
})
export class FleetModule {}
