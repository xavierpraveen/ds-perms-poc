import { Environment } from './common.types.js';

export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
}

export interface ModuleField {
  id: string;
  moduleId: string;
  name: string;
  type: FieldType;
  required: boolean;
  sensitive: boolean;
  description?: string;
  order: number;
}

export interface Module {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  environment: Environment;
  createdAt: Date;
  updatedAt: Date;
  fields: ModuleField[];
}

export interface CreateModuleDto {
  name: string;
  slug?: string;
  description?: string;
  environment: Environment;
  fields?: CreateModuleFieldDto[];
}

export interface CreateModuleFieldDto {
  name: string;
  type: FieldType;
  required?: boolean;
  sensitive?: boolean;
  description?: string;
  order?: number;
}

export interface UpdateModuleDto {
  name?: string;
  description?: string;
  environment?: Environment;
}

export interface UpdateModuleFieldDto {
  name?: string;
  type?: FieldType;
  required?: boolean;
  sensitive?: boolean;
  description?: string;
  order?: number;
}

export interface ReorderFieldsDto {
  fieldIds: string[];
}
