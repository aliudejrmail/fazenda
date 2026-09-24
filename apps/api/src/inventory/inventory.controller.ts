import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import {
  CreateInventoryItemDto,
  CreateStockMovementDto,
} from './dto/inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  listItems(@FarmId() farmId: string) {
    return this.inventoryService.listItems(farmId);
  }

  @Post('items')
  createItem(@FarmId() farmId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(farmId, dto);
  }

  @Get('movements')
  listMovements(@FarmId() farmId: string) {
    return this.inventoryService.listMovements(farmId);
  }

  @Post('movements')
  createMovement(
    @FarmId() farmId: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.inventoryService.createMovement(farmId, dto);
  }
}
