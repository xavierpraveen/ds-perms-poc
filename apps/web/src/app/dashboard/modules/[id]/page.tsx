'use client';

import { use, useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Tabs,
  Segmented,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useModule, useUpdateModule } from '@/hooks/useModules';
import ModuleFieldBuilder from '@/components/modules/ModuleFieldBuilder';
import type { CreateModuleFieldDto, FieldType, Environment } from '@dmds/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: module, isLoading } = useModule(id);
  const updateModule = useUpdateModule(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (module) {
      setName(module.name);
      setDescription(module.description || '');
    }
  }, [module]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin /></div>;
  if (!module) return <Alert type="error" message="Module not found" />;

  const fields: CreateModuleFieldDto[] = module.fields.map((f) => ({
    name: f.name,
    type: f.type as unknown as FieldType,
    required: f.required,
    sensitive: f.sensitive,
    order: f.order,
  }));

  const handleSave = async () => {
    await updateModule.mutateAsync({ name, description });
    router.push('/dashboard/modules');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Edit Module — {module.name}</Title>
        <Text type="secondary" style={{ fontFamily: 'monospace' }}>/{module.slug}</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Module Name</Text>
            <Input value={name} onChange={(e) => setName(e.target.value)} size="large" />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Description</Text>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </Space>
      </Card>

      <Card title="Schema Fields" style={{ marginBottom: 24 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          To edit fields, delete and recreate them or use the API. Existing permissions will be preserved.
        </Text>
        <ModuleFieldBuilder fields={fields} onChange={() => {}} />
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button type="primary" onClick={handleSave} loading={updateModule.isPending}>
            Save Changes
          </Button>
        </Space>
      </div>
    </div>
  );
}
