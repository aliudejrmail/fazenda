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
import { CostCenter, RevenueType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateExpenseCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(CostCenter)
  costCenter!: CostCenter;
}

export class CreateExpenseDto {
  @IsEnum(CostCenter)
  costCenter!: CostCenter;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRevenueDto {
  @IsEnum(RevenueType)
  type!: RevenueType;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weightArroba?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
