import { Environment } from './common.types.js';

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  environment: Environment;
  active: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  moduleTags?: ModuleTag[];
}

export interface ModuleTag {
  moduleName: string;
  moduleSlug: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/** Returned once on creation — never again */
export interface CreateApiKeyResponse extends ApiKey {
  key: string;
}

export interface CreateApiKeyDto {
  name: string;
  environment: Environment;
  expiresAt?: string;
}

export interface UpdateApiKeyDto {
  name?: string;
  active?: boolean;
}
