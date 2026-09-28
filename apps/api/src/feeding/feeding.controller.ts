import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { FeedingService } from './feeding.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import {
  CreateFeedAssignmentDto,
  CreateFeedDietDto,
  CreateFeedRecordDto,
  SetDietIngredientsDto,
  UpdateFeedDietDto,
} from './dto/feeding.dto';

@ApiTags('feeding')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('feeding')
export class FeedingController {
  constructor(private readonly feedingService: FeedingService) {}

  @Get('summary')
  summary(
    @FarmId() farmId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.feedingService.summary(farmId, from, to);
  }

  @Get('diets')
  listDiets(@FarmId() farmId: string) {
    return this.feedingService.listDiets(farmId);
  }

  @Post('diets')
  createDiet(@FarmId() farmId: string, @Body() dto: CreateFeedDietDto) {
    return this.feedingService.createDiet(farmId, dto);
  }

  @Get('diets/:id')
  getDiet(@FarmId() farmId: string, @Param('id') id: string) {
    return this.feedingService.getDiet(farmId, id);
  }

  @Patch('diets/:id')
  updateDiet(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFeedDietDto,
  ) {
    return this.feedingService.updateDiet(farmId, id, dto);
  }

  @Put('diets/:id/ingredients')
  setIngredients(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: SetDietIngredientsDto,
  ) {
    return this.feedingService.setIngredients(farmId, id, dto);
  }

  @Delete('diets/:id')
  removeDiet(@FarmId() farmId: string, @Param('id') id: string) {
    return this.feedingService.removeDiet(farmId, id);
  }

  @Get('assignments')
  listAssignments(
    @FarmId() farmId: string,
    @Query('all') all?: string,
  ) {
    return this.feedingService.listAssignments(farmId, all !== '1');
  }

  @Post('assignments')
  assignDiet(
    @FarmId() farmId: string,
    @Body() dto: CreateFeedAssignmentDto,
  ) {
    return this.feedingService.assignDiet(farmId, dto);
  }

  @Get('records')
  listRecords(
    @FarmId() farmId: string,
    @Query('herdLotId') herdLotId?: string,
  ) {
    return this.feedingService.listRecords(farmId, herdLotId);
  }

  @Post('records')
  createRecord(
    @FarmId() farmId: string,
    @Body() dto: CreateFeedRecordDto,
  ) {
    return this.feedingService.createRecord(farmId, dto);
  }
}
