import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVaccineDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  /** Lote do fabricante */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  batchNumber?: string;

  /** Validade do lote */
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Atualização parcial. Campos opcionais aceitam `null` para limpar o valor
 * (ex.: remover a validade).
 */
export class UpdateVaccineDto extends PartialType(CreateVaccineDto) {
  /** false = inativar; true = reativar */
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateCampaignDto {
  @IsString()
  vaccineId!: string;

  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  doses!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cost?: number;

  @IsOptional()
  @IsString()
  herdLotId?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  /** Lote do fabricante da vacina */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  batchNumber?: string;

  /** Validade do lote da vacina */
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}
