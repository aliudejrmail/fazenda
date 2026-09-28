import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DietIngredientDto {
  @IsString()
  inventoryItemId!: string;

  @IsNumber()
  @Min(0.01)
  @Max(100)
  @Type(() => Number)
  percent!: number;
}

export class CreateFeedDietDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  kgPerAnimal!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietIngredientDto)
  ingredients?: DietIngredientDto[];
}

export class UpdateFeedDietDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  kgPerAnimal?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SetDietIngredientsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DietIngredientDto)
  ingredients!: DietIngredientDto[];
}

export class CreateFeedAssignmentDto {
  @IsString()
  herdLotId!: string;

  @IsString()
  dietId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  kgPerAnimal?: number;
}

export class CreateFeedRecordDto {
  @IsString()
  herdLotId!: string;

  @IsOptional()
  @IsString()
  dietId?: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  animals?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  kgPerAnimal?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
