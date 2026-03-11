import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, MinLength } from 'class-validator';
import { Environment, FieldType } from '@dmds/types';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment;
}

export class UpdateModuleFieldDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(FieldType)
  type?: FieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  sensitive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class ReorderFieldsDto {
  fieldIds: string[];
}
