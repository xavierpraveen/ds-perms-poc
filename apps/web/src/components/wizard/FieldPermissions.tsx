'use client';

import { Collapse, Switch, Space, Typography, Tag, Alert } from 'antd';
import type { Module, WizardState } from '@dmds/types';

const { Text } = Typography;

interface FieldPermissionsProps {
  modules: Module[];
  modulePermissions: WizardState['modulePermissions'];
  fieldPermissions: WizardState['fieldPermissions'];
  onChange: (fp: WizardState['fieldPermissions']) => void;
}

export default function FieldPermissions({
  modules,
  modulePermissions,
  fieldPermissions,
  onChange,
}: FieldPermissionsProps) {
  const handleToggle = (fieldId: string, allowed: boolean) => {
    onChange({ ...fieldPermissions, [fieldId]: allowed });
  };

  const handleToggleAll = (fields: Module['fields'], allowed: boolean) => {
    const updates: WizardState['fieldPermissions'] = { ...fieldPermissions };
    fields.forEach((f) => {
      updates[f.id] = allowed;
    });
    onChange(updates);
  };

  const items = modules.map((mod) => {
    const modPerm = modulePermissions[mod.id];
    const canRead = modPerm?.canRead ?? false;

    const allAllowed = mod.fields.every((f) => fieldPermissions[f.id] !== false);
    const someAllowed = mod.fields.some((f) => fieldPermissions[f.id] !== false);

    return {
      key: mod.id,
      label: (
        <Space>
          <Text strong>{mod.name}</Text>
          {!canRead && (
            <Tag color="warning" style={{ fontSize: 10 }}>
              No read access — field permissions are inactive
            </Tag>
          )}
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {!canRead && (
            <Alert
              type="warning"
              message="Field-level access has no effect without Read permission on this module."
              style={{ marginBottom: 8 }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Space>
              <Text style={{ fontSize: 12 }}>Allow all</Text>
              <Switch
                size="small"
                checked={allAllowed}
                disabled={!canRead}
                onChange={(checked) => handleToggleAll(mod.fields, checked)}
              />
            </Space>
          </div>
          {mod.fields.map((field) => {
            const allowed = fieldPermissions[field.id] !== false; // default is allowed
            return (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  background: allowed && canRead ? '#f6ffed' : '#fafafa',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: allowed && canRead ? '#b7eb8f' : '#f0f0f0',
                }}
              >
                <Space>
                  <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>{field.name}</Text>
                  <Tag style={{ fontSize: 10 }}>{field.type}</Tag>
                  {field.required && <Tag color="blue" style={{ fontSize: 10 }}>required</Tag>}
                  {field.sensitive && (
                    <Tag color="red" style={{ fontSize: 10 }}>
                      🔒 sensitive
                    </Tag>
                  )}
                </Space>
                <Switch
                  size="small"
                  checked={allowed}
                  disabled={!canRead}
                  onChange={(checked) => handleToggle(field.id, checked)}
                  checkedChildren="Allow"
                  unCheckedChildren="Deny"
                />
              </div>
            );
          })}
        </Space>
      ),
    };
  });

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          Field-Level Access
        </Text>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
          Control which fields are visible per module. Sensitive fields are highlighted. New fields are
          allowed by default.
        </Text>
      </div>
      {modules.length === 0 ? (
        <Text type="secondary">No modules selected</Text>
      ) : (
        <Collapse items={items} defaultActiveKey={modules.map((m) => m.id)} />
      )}
    </Space>
  );
}
