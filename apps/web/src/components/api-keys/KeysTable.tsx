'use client';

import { Table, Switch, Tag, Button, Space, Tooltip, Popconfirm, Typography, Badge } from 'antd';
import { DeleteOutlined, EditOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ApiKey } from '@dmds/types';
import SparklineCell from './SparklineCell';
import { useUpdateApiKey, useDeleteApiKey } from '@/hooks/useApiKeys';

const { Text } = Typography;

function ActionCell({ record }: { record: ApiKey }) {
  const router = useRouter();
  const updateMutation = useUpdateApiKey(record.id);
  const deleteMutation = useDeleteApiKey(record.id);

  return (
    <Space>
      <Tooltip title="Test this key">
        <Button
          icon={<ExperimentOutlined />}
          size="small"
          onClick={() => router.push(`/dashboard/keys/${record.id}/test`)}
        />
      </Tooltip>
      <Tooltip title="Edit permissions">
        <Button
          icon={<EditOutlined />}
          size="small"
          onClick={() => router.push(`/dashboard/keys/${record.id}/edit`)}
        />
      </Tooltip>
      <Popconfirm
        title="Revoke this API key?"
        description="This will permanently delete the key and cannot be undone."
        onConfirm={() => deleteMutation.mutate()}
        okText="Revoke"
        okButtonProps={{ danger: true }}
      >
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          loading={deleteMutation.isPending}
        />
      </Popconfirm>
    </Space>
  );
}

export default function KeysTable({ keys }: { keys: ApiKey[] }) {
  const updateMutation = useUpdateApiKey(''); // will be called per-row

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ApiKey) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {record.keyPrefix}...
          </Text>
        </Space>
      ),
    },
    {
      title: 'Environment',
      dataIndex: 'environment',
      key: 'environment',
      render: (env: string) => (
        <Tag color={env === 'PRODUCTION' ? 'red' : 'blue'}>
          {env === 'PRODUCTION' ? 'Production' : 'Sandbox'}
        </Tag>
      ),
      width: 110,
    },
    {
      title: 'Modules',
      key: 'modules',
      render: (_: unknown, record: ApiKey) => (
        <Space wrap size={4}>
          {record.moduleTags?.slice(0, 3).map((tag) => {
            const perms = [
              tag.canRead && 'R',
              tag.canCreate && 'C',
              tag.canUpdate && 'U',
              tag.canDelete && 'D',
            ]
              .filter(Boolean)
              .join('');
            return (
              <Tag key={tag.moduleSlug} style={{ fontSize: 11 }}>
                {tag.moduleName}: {perms || 'none'}
              </Tag>
            );
          })}
          {(record.moduleTags?.length || 0) > 3 && (
            <Tag style={{ fontSize: 11 }}>+{(record.moduleTags?.length || 0) - 3} more</Tag>
          )}
          {!record.moduleTags?.length && <Text type="secondary" style={{ fontSize: 12 }}>No modules</Text>}
        </Space>
      ),
    },
    {
      title: '7-day usage',
      key: 'sparkline',
      render: (_: unknown, record: ApiKey) => <SparklineCell apiKeyId={record.id} />,
      width: 140,
    },
    {
      title: 'Last used',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date: string) =>
        date ? (
          <Tooltip title={new Date(date).toLocaleString()}>
            <Text style={{ fontSize: 12 }}>{formatRelative(date)}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>Never</Text>
        ),
      width: 100,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: ApiKey) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const mutation = useUpdateApiKey(record.id);
        return (
          <Switch
            checked={record.active}
            onChange={(checked) => mutation.mutate({ active: checked })}
            loading={mutation.isPending}
            checkedChildren="Active"
            unCheckedChildren="Off"
          />
        );
      },
      width: 120,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>{new Date(date).toLocaleDateString()}</Text>
      ),
      width: 100,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: ApiKey) => <ActionCell record={record} />,
      width: 110,
    },
  ];

  return (
    <Table
      dataSource={keys}
      columns={columns}
      rowKey="id"
      pagination={{ pageSize: 10, showTotal: (total) => `${total} keys` }}
      size="middle"
    />
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
