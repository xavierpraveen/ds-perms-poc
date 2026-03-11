'use client';

import { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Segmented,
  Tabs,
  Alert,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCreateModule } from '@/hooks/useModules';
import ModuleFieldBuilder from '@/components/modules/ModuleFieldBuilder';
import type { CreateModuleFieldDto, FieldType, Environment } from '@dmds/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

function fieldsToJson(fields: CreateModuleFieldDto[]): string {
  const schema: Record<string, unknown> = {
    type: 'object',
    properties: Object.fromEntries(
      fields.filter((f) => f.name).map((f) => [
        f.name,
        {
          type: f.type.toLowerCase(),
          ...(f.required ? { required: true } : {}),
          ...(f.sensitive ? { 'x-sensitive': true } : {}),
        },
      ]),
    ),
    required: fields.filter((f) => f.required && f.name).map((f) => f.name),
  };
  return JSON.stringify(schema, null, 2);
}

function jsonToFields(json: string): CreateModuleFieldDto[] | null {
  try {
    const schema = JSON.parse(json);
    const props = schema.properties || {};
    const required = schema.required || [];
    return Object.entries(props).map(([name, def], i) => ({
      name,
      type: ((def as Record<string, string>).type?.toUpperCase() || 'STRING') as FieldType,
      required: required.includes(name),
      sensitive: !!(def as Record<string, unknown>)['x-sensitive'],
      order: i,
    }));
  } catch {
    return null;
  }
}

export default function NewModulePage() {
  const router = useRouter();
  const createModule = useCreateModule();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<Environment>('PRODUCTION' as Environment);
  const [fields, setFields] = useState<CreateModuleFieldDto[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    if (tab === 'json') {
      setJsonValue(fieldsToJson(fields));
    } else {
      const parsed = jsonToFields(jsonValue);
      if (parsed) {
        setFields(parsed);
        setJsonError(null);
      } else {
        setJsonError('Invalid JSON schema — reverting to visual view');
      }
    }
    setActiveTab(tab as 'visual' | 'json');
  };

  const handleJsonChange = (val: string) => {
    setJsonValue(val);
    const parsed = jsonToFields(val);
    if (parsed) {
      setFields(parsed);
      setJsonError(null);
    } else {
      setJsonError('Invalid JSON schema');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    await createModule.mutateAsync({
      name,
      description: description || undefined,
      environment,
      fields: fields.filter((f) => f.name),
    });
    router.push('/dashboard/modules');
  };

  const tabItems = [
    {
      key: 'visual',
      label: '🎨 Visual Builder',
      children: (
        <ModuleFieldBuilder fields={fields} onChange={setFields} />
      ),
    },
    {
      key: 'json',
      label: '{ } Raw JSON',
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          {jsonError && <Alert type="warning" message={jsonError} />}
          <TextArea
            value={jsonValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={20}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Create Module</Title>
        <Text type="secondary">Define a new dynamic data module with a custom schema</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Module Name</Text>
            <Input
              placeholder="e.g. Customers, Products, Orders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="large"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Description (optional)</Text>
            <Input
              placeholder="What does this module store?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Environment</Text>
            <Segmented
              value={environment}
              onChange={(val) => setEnvironment(val as Environment)}
              options={[
                { label: '🟢 Production', value: 'PRODUCTION' },
                { label: '🔵 Sandbox', value: 'SANDBOX' },
              ]}
            />
          </div>
        </Space>
      </Card>

      <Card title="Schema Fields" style={{ marginBottom: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={createModule.isPending}
            disabled={!name.trim()}
          >
            Create Module
          </Button>
        </Space>
      </div>
    </div>
  );
}
