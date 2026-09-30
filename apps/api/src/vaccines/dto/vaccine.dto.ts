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

  /** Item existente do Almoxarifado que controla o estoque de doses */
  @IsOptional()
  @IsString()
  inventoryItemId?: string;

  /** Cria um item no Almoxarifado com este estoque inicial (doses) */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockDoses?: number;

  /** Estoque mínimo (doses) do item criado junto com a vacina */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minStockDoses?: number;

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
