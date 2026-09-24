import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, FarmGuard],
})
export class InventoryModule {}
