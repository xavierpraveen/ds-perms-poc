'use client';

import { Collapse, Checkbox, Space, Typography, Tag } from 'antd';
import type { Module, WizardState } from '@dmds/types';

const { Text } = Typography;

interface PermissionMatrixProps {
  modules: Module[];
  permissions: WizardState['modulePermissions'];
  onChange: (perms: WizardState['modulePermissions']) => void;
}

const PERMISSIONS = [
  { key: 'canRead', label: 'Read', color: 'green' },
  { key: 'canCreate', label: 'Create', color: 'blue' },
  { key: 'canUpdate', label: 'Update', color: 'orange' },
  { key: 'canDelete', label: 'Delete', color: 'red' },
] as const;

export default function PermissionMatrix({ modules, permissions, onChange }: PermissionMatrixProps) {
  const handleChange = (
    moduleId: string,
    permKey: keyof WizardState['modulePermissions'][string],
    checked: boolean,
  ) => {
    onChange({
      ...permissions,
      [moduleId]: {
        canRead: permissions[moduleId]?.canRead ?? false,
        canCreate: permissions[moduleId]?.canCreate ?? false,
        canUpdate: permissions[moduleId]?.canUpdate ?? false,
        canDelete: permissions[moduleId]?.canDelete ?? false,
        [permKey]: checked,
      },
    });
  };

  const handleSelectAll = (moduleId: string, checked: boolean) => {
    onChange({
      ...permissions,
      [moduleId]: {
        canRead: checked,
        canCreate: checked,
        canUpdate: checked,
        canDelete: checked,
      },
    });
  };

  const items = modules.map((mod) => {
    const modPerms = permissions[mod.id] || {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    };
    const allSelected = Object.values(modPerms).every(Boolean);
    const someSelected = Object.values(modPerms).some(Boolean);

    return {
      key: mod.id,
      label: (
        <Space>
          <Checkbox
            checked={allSelected}
            indeterminate={!allSelected && someSelected}
            onChange={(e) => handleSelectAll(mod.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
          <Text strong>{mod.name}</Text>
          <Tag style={{ fontSize: 10 }}>{mod.slug}</Tag>
          <Tag style={{ fontSize: 10 }}>{mod.fields.length} fields</Tag>
        </Space>
      ),
      children: (
        <Space size={24} style={{ paddingLeft: 24 }}>
          {PERMISSIONS.map(({ key, label, color }) => (
            <Checkbox
              key={key}
              checked={modPerms[key]}
              onChange={(e) => handleChange(mod.id, key, e.target.checked)}
            >
              <Tag color={modPerms[key] ? color : undefined} style={{ marginLeft: 4, fontSize: 12 }}>
                {label}
              </Tag>
            </Checkbox>
          ))}
        </Space>
      ),
    };
  });

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          Configure Permissions
        </Text>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
          Set Read, Create, Update, and Delete permissions for each selected module.
        </Text>
      </div>
      <Collapse items={items} defaultActiveKey={modules.map((m) => m.id)} />
    </Space>
  );
}
