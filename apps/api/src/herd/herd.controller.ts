import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { HerdService } from './herd.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import {
  CreateBirthDto,
  CreateCullDto,
  CreateHerdLotDto,
  CreateMortalityDto,
  CreateMovementDto,
  CreatePregnancyDiagnosisDto,
  CreateReplacementDto,
  CreateWeighingDto,
  UpdateHerdLotDto,
} from './dto/herd.dto';

@ApiTags('herd')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('herd')
export class HerdController {
  constructor(private readonly herdService: HerdService) {}

  @Get('lots')
  listLots(
    @FarmId() farmId: string,
    @Query('retiroId') retiroId?: string,
  ) {
    return this.herdService.listLots(farmId, retiroId);
  }

  @Post('lots')
  createLot(@FarmId() farmId: string, @Body() dto: CreateHerdLotDto) {
    return this.herdService.createLot(farmId, dto);
  }

  @Get('lots/:id')
  getLotDetail(@FarmId() farmId: string, @Param('id') id: string) {
    return this.herdService.getLotDetail(farmId, id);
  }

  @Patch('lots/:id')
  updateLot(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHerdLotDto,
  ) {
    return this.herdService.updateLot(farmId, id, dto);
  }

  @Delete('lots/:id')
  removeLot(@FarmId() farmId: string, @Param('id') id: string) {
    return this.herdService.removeLot(farmId, id);
  }

  @Get('births')
  listBirths(
    @FarmId() farmId: string,
    @Query('retiroId') retiroId?: string,
  ) {
    return this.herdService.listBirths(farmId, retiroId);
  }

  @Post('births')
  createBirth(@FarmId() farmId: string, @Body() dto: CreateBirthDto) {
    return this.herdService.createBirth(farmId, dto);
  }

  @Get('mortalities')
  listMortalities(
    @FarmId() farmId: string,
    @Query('retiroId') retiroId?: string,
  ) {
    return this.herdService.listMortalities(farmId, retiroId);
  }

  @Post('mortalities')
  createMortality(@FarmId() farmId: string, @Body() dto: CreateMortalityDto) {
    return this.herdService.createMortality(farmId, dto);
  }

  @Get('culls')
  listCulls(@FarmId() farmId: string) {
    return this.herdService.listCulls(farmId);
  }

  @Post('culls')
  createCull(@FarmId() farmId: string, @Body() dto: CreateCullDto) {
    return this.herdService.createCull(farmId, dto);
  }

  @Get('replacements')
  listReplacements(@FarmId() farmId: string) {
    return this.herdService.listReplacements(farmId);
  }

  @Post('replacements')
  createReplacement(
    @FarmId() farmId: string,
    @Body() dto: CreateReplacementDto,
  ) {
    return this.herdService.createReplacement(farmId, dto);
  }

  @Get('movements')
  listMovements(@FarmId() farmId: string) {
    return this.herdService.listMovements(farmId);
  }

  @Post('movements')
  createMovement(@FarmId() farmId: string, @Body() dto: CreateMovementDto) {
    return this.herdService.createMovement(farmId, dto);
  }

  @Get('weighings')
  listWeighings(@FarmId() farmId: string) {
    return this.herdService.listWeighings(farmId);
  }

  @Post('weighings')
  createWeighing(@FarmId() farmId: string, @Body() dto: CreateWeighingDto) {
    return this.herdService.createWeighing(farmId, dto);
  }

  @Get('pregnancy-diagnoses')
  listPregnancyDiagnoses(
    @FarmId() farmId: string,
    @Query('retiroId') retiroId?: string,
  ) {
    return this.herdService.listPregnancyDiagnoses(farmId, retiroId);
  }

  @Post('pregnancy-diagnoses')
  createPregnancyDiagnosis(
    @FarmId() farmId: string,
    @Body() dto: CreatePregnancyDiagnosisDto,
  ) {
    return this.herdService.createPregnancyDiagnosis(farmId, dto);
  }
}
