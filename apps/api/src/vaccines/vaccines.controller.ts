import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { VaccinesService } from './vaccines.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import { CreateCampaignDto, CreateVaccineDto } from './dto/vaccine.dto';

@ApiTags('vaccines')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('vaccines')
export class VaccinesController {
  constructor(private readonly vaccinesService: VaccinesService) {}

  @Get('campaigns')
  listCampaigns(@FarmId() farmId: string) {
    return this.vaccinesService.listCampaigns(farmId);
  }

  @Post('campaigns')
  createCampaign(@FarmId() farmId: string, @Body() dto: CreateCampaignDto) {
    return this.vaccinesService.createCampaign(farmId, dto);
  }

  @Get('upcoming')
  upcoming(@FarmId() farmId: string) {
    return this.vaccinesService.upcoming(farmId);
  }

  @Get()
  listVaccines(@FarmId() farmId: string) {
    return this.vaccinesService.listVaccines(farmId);
  }

  @Post()
  createVaccine(@FarmId() farmId: string, @Body() dto: CreateVaccineDto) {
    return this.vaccinesService.createVaccine(farmId, dto);
  }
}
