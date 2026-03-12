export interface ApiKeyModulePermission {
  id: string;
  apiKeyId: string;
  moduleId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface ApiKeyFieldPermission {
  id: string;
  apiKeyId: string;
  moduleFieldId: string;
  allowed: boolean;
}

export interface ModulePermissionInput {
  moduleId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface FieldPermissionInput {
  moduleFieldId: string;
  allowed: boolean;
}

export interface AssignPermissionsDto {
  modulePermissions: ModulePermissionInput[];
  fieldPermissions: FieldPermissionInput[];
}

export interface PermissionSet {
  modulePermissions: ApiKeyModulePermission[];
  fieldPermissions: ApiKeyFieldPermission[];
}

/** Wizard local state shape */
export interface WizardState {
  selectedModuleIds: string[];
  modulePermissions: Record<
    string,
    {
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    }
  >;
  fieldPermissions: Record<string, boolean>; // moduleFieldId → allowed
}
