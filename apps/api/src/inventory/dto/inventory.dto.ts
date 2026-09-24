import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { InventoryCategory, StockMovementType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateInventoryItemDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(InventoryCategory)
  category!: InventoryCategory;

  @IsString()
  unit!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  avgUnitCost?: number;
}

export class CreateStockMovementDto {
  @IsString()
  itemId!: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsNumber()
  @Type(() => Number)
  quantity!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
