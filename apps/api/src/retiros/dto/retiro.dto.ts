import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRetiroDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  matricesPregnant?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  matricesEmpty?: number;
}

export class UpdateRetiroDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  /** false = inativar; true = reativar */
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  matricesPregnant?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  matricesEmpty?: number;
}
