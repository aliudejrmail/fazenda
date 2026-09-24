import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { VehicleType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(VehicleType)
  type!: VehicleType;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFuelDto {
  @IsString()
  vehicleId!: string;

  @IsDateString()
  date!: string;

  @IsNumber()
  @Type(() => Number)
  liters!: number;

  @IsNumber()
  @Type(() => Number)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  odometer?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMaintenanceDto {
  @IsString()
  vehicleId!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsNumber()
  @Type(() => Number)
  cost!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
