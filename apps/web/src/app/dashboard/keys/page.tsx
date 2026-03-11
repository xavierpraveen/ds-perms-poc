'use client';

import { Button, Typography, Space, Spin, Empty, Alert } from 'antd';
import { PlusOutlined, KeyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useApiKeys } from '@/hooks/useApiKeys';
import KeysTable from '@/components/api-keys/KeysTable';

const { Title, Text } = Typography;

export default function KeysDashboard() {
  const router = useRouter();
  const { data: keys, isLoading, error } = useApiKeys();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0 }}>
            <KeyOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            API Credentials
          </Title>
          <Text type="secondary">Manage API keys and their module access permissions</Text>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => router.push('/dashboard/keys/new')}
        >
          Create New Key
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message="Failed to load API keys"
          description={(error as Error).message}
          style={{ marginBottom: 16 }}
        />
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : !keys?.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" align="center">
              <Text>No API keys yet</Text>
              <Text type="secondary">Create your first key to start accessing your dynamic modules</Text>
            </Space>
          }
        >
          <Button type="primary" onClick={() => router.push('/dashboard/keys/new')}>
            Create your first key
          </Button>
        </Empty>
      ) : (
        <KeysTable keys={keys} />
      )}
    </div>
  );
}
