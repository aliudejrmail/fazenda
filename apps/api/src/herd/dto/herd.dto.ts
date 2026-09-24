import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  CullReason,
  HerdCategory,
  LotStatus,
  MovementType,
  ProductionSystem,
  TrackingMode,
} from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateHerdLotDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(HerdCategory)
  category!: HerdCategory;

  @IsEnum(ProductionSystem)
  system!: ProductionSystem;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsEnum(TrackingMode)
  trackingMode?: TrackingMode;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateHerdLotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(HerdCategory)
  category?: HerdCategory;

  @IsOptional()
  @IsEnum(ProductionSystem)
  system?: ProductionSystem;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBirthDto {
  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  matricesParidas!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  bezerros!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  bezerras!: number;

  @IsOptional()
  @IsString()
  herdLotId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMortalityDto {
  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsEnum(HerdCategory)
  category?: HerdCategory;

  @IsOptional()
  @IsString()
  herdLotId?: string;

  @IsOptional()
  @IsString()
  cause?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCullDto {
  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsEnum(CullReason)
  reason!: CullReason;

  @IsOptional()
  @IsString()
  herdLotId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReplacementDto {
  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @Type(() => Number)
  unitCost!: number;

  @IsOptional()
  @IsString()
  herdLotId?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMovementDto {
  @IsEnum(MovementType)
  type!: MovementType;

  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsString()
  fromLotId?: string;

  @IsOptional()
  @IsString()
  toLotId?: string;

  @IsOptional()
  @IsEnum(ProductionSystem)
  toSystem?: ProductionSystem;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weightArroba?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWeighingDto {
  @IsString()
  herdLotId!: string;

  @IsDateString()
  date!: string;

  @IsNumber()
  @Type(() => Number)
  avgWeightKg!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
