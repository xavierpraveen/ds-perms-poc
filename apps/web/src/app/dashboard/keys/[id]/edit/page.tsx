'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApiKey, useApiKeyPermissions, useAssignPermissions } from '@/hooks/useApiKeys';
import { useModules } from '@/hooks/useModules';
import PermissionMatrix from '@/components/wizard/PermissionMatrix';
import FieldPermissions from '@/components/wizard/FieldPermissions';
import type { WizardState, AssignPermissionsDto } from '@dmds/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditKeyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: apiKey, isLoading: keyLoading } = useApiKey(id);
  const { data: permSet, isLoading: permsLoading } = useApiKeyPermissions(id);
  const { data: modules = [] } = useModules();
  const assignPerms = useAssignPermissions(id);

  const [modulePermissions, setModulePermissions] = useState<WizardState['modulePermissions']>({});
  const [fieldPermissions, setFieldPermissions] = useState<WizardState['fieldPermissions']>({});

  useEffect(() => {
    if (permSet) {
      const mp: WizardState['modulePermissions'] = {};
      permSet.modulePermissions.forEach((p) => {
        mp[p.moduleId] = {
          canRead: p.canRead,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
        };
      });
      setModulePermissions(mp);

      const fp: WizardState['fieldPermissions'] = {};
      permSet.fieldPermissions.forEach((p) => {
        fp[p.moduleFieldId] = p.allowed;
      });
      setFieldPermissions(fp);
    }
  }, [permSet]);

  const selectedModules = modules.filter((m) =>
    Object.keys(modulePermissions).includes(m.id),
  );

  const handleSave = async () => {
    const dto: AssignPermissionsDto = {
      modulePermissions: Object.entries(modulePermissions).map(([moduleId, perms]) => ({
        moduleId,
        ...perms,
      })),
      fieldPermissions: Object.entries(fieldPermissions)
        .filter(([, allowed]) => allowed)
        .map(([moduleFieldId]) => ({ moduleFieldId, allowed: true })),
    };
    await assignPerms.mutateAsync(dto);
    router.push('/dashboard/keys');
  };

  if (keyLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Permissions — {apiKey?.name}</h1>
        <p className="text-sm text-muted-foreground">
          Update module and field-level permissions for this API key
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <PermissionMatrix
            modules={modules}
            permissions={modulePermissions}
            onChange={setModulePermissions}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <FieldPermissions
            modules={selectedModules}
            modulePermissions={modulePermissions}
            fieldPermissions={fieldPermissions}
            onChange={setFieldPermissions}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={assignPerms.isPending}>
          {assignPerms.isPending && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          Save Permissions
        </Button>
      </div>
    </div>
  );
}
