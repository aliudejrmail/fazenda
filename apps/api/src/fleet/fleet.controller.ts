import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { FleetService } from './fleet.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import {
  CreateFuelDto,
  CreateMaintenanceDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/fleet.dto';

@ApiTags('fleet')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('vehicles')
  listVehicles(@FarmId() farmId: string) {
    return this.fleetService.listVehicles(farmId);
  }

  @Post('vehicles')
  createVehicle(@FarmId() farmId: string, @Body() dto: CreateVehicleDto) {
    return this.fleetService.createVehicle(farmId, dto);
  }

  @Patch('vehicles/:id')
  updateVehicle(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.fleetService.updateVehicle(farmId, id, dto);
  }

  @Get('fuel')
  listFuel(@FarmId() farmId: string) {
    return this.fleetService.listFuel(farmId);
  }

  @Post('fuel')
  createFuel(@FarmId() farmId: string, @Body() dto: CreateFuelDto) {
    return this.fleetService.createFuel(farmId, dto);
  }

  @Get('maintenance')
  listMaintenance(@FarmId() farmId: string) {
    return this.fleetService.listMaintenance(farmId);
  }

  @Post('maintenance')
  createMaintenance(
    @FarmId() farmId: string,
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.fleetService.createMaintenance(farmId, dto);
  }
}
