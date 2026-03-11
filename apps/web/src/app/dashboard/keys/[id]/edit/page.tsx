'use client';

import { use } from 'react';
import { Typography, Spin, Alert } from 'antd';
import { useApiKey, useApiKeyPermissions, useAssignPermissions } from '@/hooks/useApiKeys';
import { useModules } from '@/hooks/useModules';
import PermissionMatrix from '@/components/wizard/PermissionMatrix';
import FieldPermissions from '@/components/wizard/FieldPermissions';
import type { WizardState, AssignPermissionsDto } from '@dmds/types';
import { useState, useEffect } from 'react';
import { Button, Space, Card } from 'antd';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

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
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin /></div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Edit Permissions — {apiKey?.name}</Title>
        <Text type="secondary">Update module and field-level permissions for this API key</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <PermissionMatrix
          modules={modules}
          permissions={modulePermissions}
          onChange={setModulePermissions}
        />
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <FieldPermissions
          modules={selectedModules}
          modulePermissions={modulePermissions}
          fieldPermissions={fieldPermissions}
          onChange={setFieldPermissions}
        />
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button type="primary" onClick={handleSave} loading={assignPerms.isPending}>
            Save Permissions
          </Button>
        </Space>
      </div>
    </div>
  );
}
