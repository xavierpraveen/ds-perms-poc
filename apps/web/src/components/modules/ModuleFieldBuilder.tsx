'use client';

import { useState } from 'react';
import {
  Button,
  Select,
  Input,
  Switch,
  Space,
  Typography,
  Card,
  Tag,
  Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import type { CreateModuleFieldDto, FieldType } from '@dmds/types';

const { Text } = Typography;

const FIELD_TYPES = [
  { value: 'STRING', label: 'String', color: 'blue' },
  { value: 'NUMBER', label: 'Number', color: 'green' },
  { value: 'BOOLEAN', label: 'Boolean', color: 'purple' },
  { value: 'DATE', label: 'Date', color: 'orange' },
  { value: 'JSON', label: 'JSON', color: 'cyan' },
  { value: 'ARRAY', label: 'Array', color: 'magenta' },
];

interface ModuleFieldBuilderProps {
  fields: CreateModuleFieldDto[];
  onChange: (fields: CreateModuleFieldDto[]) => void;
}

const emptyField = (): CreateModuleFieldDto => ({
  name: '',
  type: 'STRING' as FieldType,
  required: false,
  sensitive: false,
  order: 0,
});

export default function ModuleFieldBuilder({ fields, onChange }: ModuleFieldBuilderProps) {
  const addField = () => {
    onChange([...fields, { ...emptyField(), order: fields.length }]);
  };

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, patch: Partial<CreateModuleFieldDto>) => {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      {/* Header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 130px 90px 90px 32px',
          gap: 8,
          paddingLeft: 32,
          paddingRight: 8,
        }}
      >
        <Text type="secondary" style={{ fontSize: 11 }}>FIELD NAME</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>TYPE</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>REQUIRED</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>SENSITIVE</Text>
        <span />
      </div>

      {fields.map((field, idx) => (
        <div
          key={idx}
          style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr 130px 90px 90px 32px',
            gap: 8,
            alignItems: 'center',
            padding: '8px',
            background: '#fafafa',
            borderRadius: 6,
            border: '1px solid #f0f0f0',
          }}
        >
          <HolderOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />
          <Input
            placeholder="field_name"
            value={field.name}
            onChange={(e) => updateField(idx, { name: e.target.value })}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Select
            value={field.type}
            onChange={(val) => updateField(idx, { type: val as FieldType })}
            options={FIELD_TYPES.map((t) => ({
              value: t.value,
              label: <Tag color={t.color} style={{ fontSize: 11 }}>{t.label}</Tag>,
            }))}
            size="small"
          />
          <div style={{ textAlign: 'center' }}>
            <Switch
              size="small"
              checked={field.required}
              onChange={(checked) => updateField(idx, { required: checked })}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Tooltip title="Mark this field as sensitive (e.g. PII data)">
              <Switch
                size="small"
                checked={field.sensitive}
                onChange={(checked) => updateField(idx, { sensitive: checked })}
              />
            </Tooltip>
          </div>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            type="text"
            danger
            onClick={() => removeField(idx)}
          />
        </div>
      ))}

      <Button
        icon={<PlusOutlined />}
        type="dashed"
        block
        onClick={addField}
        style={{ marginTop: 4 }}
      >
        Add Field
      </Button>
    </Space>
  );
}
