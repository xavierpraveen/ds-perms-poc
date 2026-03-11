import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString, MinLength } from 'class-validator';
import { Environment } from '@dmds/types';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(Environment)
  environment: Environment;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ModulePermissionInputDto {
  @IsString()
  moduleId: string;

  @IsBoolean()
  canRead: boolean;

  @IsBoolean()
  canCreate: boolean;

  @IsBoolean()
  canUpdate: boolean;

  @IsBoolean()
  canDelete: boolean;
}

export class FieldPermissionInputDto {
  @IsString()
  moduleFieldId: string;

  @IsBoolean()
  allowed: boolean;
}

export class AssignPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModulePermissionInputDto)
  modulePermissions: ModulePermissionInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldPermissionInputDto)
  fieldPermissions: FieldPermissionInputDto[];
}
