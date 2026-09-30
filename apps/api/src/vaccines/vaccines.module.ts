import { Module } from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { CampaignsService } from './campaigns.service';
import { VaccinesController } from './vaccines.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  imports: [InventoryModule],
  controllers: [VaccinesController],
  providers: [VaccinesService, CampaignsService, FarmGuard],
})
export class VaccinesModule {}
