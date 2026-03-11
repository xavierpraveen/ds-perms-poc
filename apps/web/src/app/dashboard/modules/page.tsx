'use client';

import { useState } from 'react';
import {
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Popconfirm,
  Alert,
  Tabs,
  Empty,
  Spin,
} from 'antd';
import { PlusOutlined, AppstoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useModules, useDeleteModule } from '@/hooks/useModules';
import type { Module, Environment } from '@dmds/types';

const { Title, Text } = Typography;

function ModulesTable({ modules }: { modules: Module[] }) {
  const router = useRouter();

  function DeleteButton({ id }: { id: string }) {
    const deleteMutation = useDeleteModule(id);
    return (
      <Popconfirm
        title="Delete this module?"
        description="All associated records and permissions will be deleted."
        onConfirm={() => deleteMutation.mutate()}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteMutation.isPending} />
      </Popconfirm>
    );
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Module) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
            /{record.slug}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d: string) => d ? <Text style={{ fontSize: 13 }}>{d}</Text> : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: 'Fields',
      key: 'fields',
      render: (_: unknown, record: Module) => (
        <Space wrap size={4}>
          {record.fields.slice(0, 4).map((f) => (
            <Tag key={f.id} style={{ fontSize: 11 }}>
              {f.name}
              {f.sensitive ? ' 🔒' : ''}
            </Tag>
          ))}
          {record.fields.length > 4 && (
            <Tag style={{ fontSize: 11 }}>+{record.fields.length - 4}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: string) => <Text style={{ fontSize: 12 }}>{new Date(d).toLocaleDateString()}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Module) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => router.push(`/dashboard/modules/${record.id}`)}
          />
          <DeleteButton id={record.id} />
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={modules}
      columns={columns}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      size="middle"
    />
  );
}

export default function ModulesPage() {
  const router = useRouter();
  const [env, setEnv] = useState<Environment | undefined>();
  const { data: modules = [], isLoading, error } = useModules(env);

  const prod = modules.filter((m) => m.environment === 'PRODUCTION');
  const sandbox = modules.filter((m) => m.environment === 'SANDBOX');

  const tabItems = [
    {
      key: 'all',
      label: `All (${modules.length})`,
      children: modules.length ? <ModulesTable modules={modules} /> : null,
    },
    {
      key: 'production',
      label: `Production (${prod.length})`,
      children: <ModulesTable modules={prod} />,
    },
    {
      key: 'sandbox',
      label: `Sandbox (${sandbox.length})`,
      children: <ModulesTable modules={sandbox} />,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            Dynamic Modules
          </Title>
          <Text type="secondary">Define the data schemas your API keys can access</Text>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => router.push('/dashboard/modules/new')}
        >
          New Module
        </Button>
      </div>

      {error && <Alert type="error" message="Failed to load modules" style={{ marginBottom: 16 }} />}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin /></div>
      ) : !modules.length ? (
        <Empty description="No modules yet. Create your first module to get started.">
          <Button type="primary" onClick={() => router.push('/dashboard/modules/new')}>
            Create First Module
          </Button>
        </Empty>
      ) : (
        <Tabs items={tabItems} defaultActiveKey="all" />
      )}
    </div>
  );
}
