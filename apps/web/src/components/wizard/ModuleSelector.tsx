'use client';

import { Select, Tag, Space, Typography, Empty } from 'antd';
import type { Module } from '@dmds/types';

const { Text } = Typography;

interface ModuleSelectorProps {
  modules: Module[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function ModuleSelector({ modules, selectedIds, onChange }: ModuleSelectorProps) {
  const options = modules.map((m) => ({
    label: (
      <Space>
        <span>{m.name}</span>
        <Tag style={{ fontSize: 10 }}>{m.environment === 'PRODUCTION' ? 'Prod' : 'Sandbox'}</Tag>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {m.fields.length} fields
        </Text>
      </Space>
    ),
    value: m.id,
    searchText: `${m.name} ${m.slug}`,
  }));

  if (!modules.length) {
    return (
      <Empty
        description={
          <span>
            No modules yet.{' '}
            <a href="/dashboard/modules/new">Create a module</a> first.
          </span>
        }
      />
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          Select Modules
        </Text>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
          Choose which modules this API key can access. You'll configure permissions in the next step.
        </Text>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Search and select modules..."
          value={selectedIds}
          onChange={onChange}
          options={options}
          filterOption={(input, option) =>
            (option?.searchText as string)?.toLowerCase().includes(input.toLowerCase())
          }
          size="large"
          optionRender={(opt) => opt.label}
        />
      </div>

      {selectedIds.length > 0 && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {selectedIds.length} module{selectedIds.length > 1 ? 's' : ''} selected
          </Text>
        </div>
      )}
    </Space>
  );
}
