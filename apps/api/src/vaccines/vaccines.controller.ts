import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { VaccinesService } from './vaccines.service';
import { CampaignsService } from './campaigns.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import {
  CreateCampaignDto,
  CreateVaccineDto,
  UpdateCampaignDto,
  UpdateVaccineDto,
} from './dto/vaccine.dto';

@ApiTags('vaccines')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('vaccines')
export class VaccinesController {
  constructor(
    private readonly vaccinesService: VaccinesService,
    private readonly campaignsService: CampaignsService,
  ) {}

  @Get('campaigns')
  listCampaigns(@FarmId() farmId: string) {
    return this.campaignsService.list(farmId);
  }

  @Post('campaigns')
  createCampaign(@FarmId() farmId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(farmId, dto);
  }

  @Patch('campaigns/:id')
  updateCampaign(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(farmId, id, dto);
  }

  @Delete('campaigns/:id')
  removeCampaign(@FarmId() farmId: string, @Param('id') id: string) {
    return this.campaignsService.remove(farmId, id);
  }

  @Get('upcoming')
  upcoming(@FarmId() farmId: string) {
    return this.campaignsService.upcoming(farmId);
  }

  @Get()
  listVaccines(@FarmId() farmId: string) {
    return this.vaccinesService.listVaccines(farmId);
  }

  @Post()
  createVaccine(@FarmId() farmId: string, @Body() dto: CreateVaccineDto) {
    return this.vaccinesService.createVaccine(farmId, dto);
  }

  @Patch(':id')
  updateVaccine(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVaccineDto,
  ) {
    return this.vaccinesService.updateVaccine(farmId, id, dto);
  }

  @Delete(':id')
  removeVaccine(@FarmId() farmId: string, @Param('id') id: string) {
    return this.vaccinesService.removeVaccine(farmId, id);
  }
}
