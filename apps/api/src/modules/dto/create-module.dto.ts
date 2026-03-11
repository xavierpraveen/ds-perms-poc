import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Environment, FieldType } from '@dmds/types';

export class CreateModuleFieldDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(FieldType)
  type: FieldType;

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

export class CreateModuleDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens only' })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Environment)
  environment: Environment;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuleFieldDto)
  fields?: CreateModuleFieldDto[];
}
