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
import { RetirosService } from './retiros.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/auth.decorators';
import { CreateRetiroDto, UpdateRetiroDto } from './dto/retiro.dto';

@ApiTags('retiros')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Farm-Id', required: true })
@UseGuards(AuthGuard('jwt'), FarmGuard)
@Controller('retiros')
export class RetirosController {
  constructor(private readonly retirosService: RetirosService) {}

  @Get()
  list(@FarmId() farmId: string) {
    return this.retirosService.list(farmId);
  }

  @Post()
  create(@FarmId() farmId: string, @Body() dto: CreateRetiroDto) {
    return this.retirosService.create(farmId, dto);
  }

  @Get(':id/summary')
  summary(@FarmId() farmId: string, @Param('id') id: string) {
    return this.retirosService.summary(farmId, id);
  }

  @Get(':id')
  findOne(@FarmId() farmId: string, @Param('id') id: string) {
    return this.retirosService.findOne(farmId, id);
  }

  @Patch(':id')
  update(
    @FarmId() farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRetiroDto,
  ) {
    return this.retirosService.update(farmId, id, dto);
  }

  @Delete(':id')
  remove(@FarmId() farmId: string, @Param('id') id: string) {
    return this.retirosService.remove(farmId, id);
  }
}
