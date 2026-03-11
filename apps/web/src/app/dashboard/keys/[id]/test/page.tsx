'use client';

import { use, useState } from 'react';
import {
  Card,
  Select,
  Button,
  Tabs,
  Input,
  Space,
  Typography,
  Tag,
  Alert,
  Spin,
  Divider,
  Badge,
} from 'antd';
import { SendOutlined, CodeOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useApiKey } from '@/hooks/useApiKeys';
import { useModules } from '@/hooks/useModules';
import type { Module } from '@dmds/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'green',
  POST: 'blue',
  PATCH: 'orange',
  DELETE: 'red',
};

function buildSchemaTemplate(module: Module): string {
  const obj: Record<string, string> = {};
  module.fields.forEach((f) => {
    switch (f.type) {
      case 'STRING': obj[f.name] = ''; break;
      case 'NUMBER': obj[f.name] = '0' as unknown as string; break;
      case 'BOOLEAN': obj[f.name] = 'true' as unknown as string; break;
      case 'DATE': obj[f.name] = new Date().toISOString(); break;
      case 'JSON': obj[f.name] = '{}' as unknown as string; break;
      case 'ARRAY': obj[f.name] = '[]' as unknown as string; break;
    }
  });
  return JSON.stringify(obj, null, 2);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ApiKeyTesterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: apiKey, isLoading: keyLoading } = useApiKey(id);
  const { data: modules = [] } = useModules();

  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [rawKey, setRawKey] = useState('');
  const [body, setBody] = useState('');
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);
  const [response, setResponse] = useState<{
    status: number;
    data: unknown;
    latencyMs: number;
    logId?: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const selectedModule = modules.find((m) => m.slug === selectedSlug);

  const handleModuleChange = (slug: string) => {
    setSelectedSlug(slug);
    const mod = modules.find((m) => m.slug === slug);
    if (mod && (method === 'POST' || method === 'PATCH')) {
      setBody(buildSchemaTemplate(mod));
    }
  };

  const handleMethodChange = (m: HttpMethod) => {
    setMethod(m);
    if ((m === 'POST' || m === 'PATCH') && selectedModule) {
      setBody(buildSchemaTemplate(selectedModule));
    } else if (m === 'GET' || m === 'DELETE') {
      setBody('');
    }
  };

  const endpointUrl = selectedSlug
    ? `${API_URL}/data/${selectedSlug}${method === 'GET' ? '' : ''}`
    : '';

  const handleSend = async () => {
    if (!selectedSlug || !rawKey) return;
    setSending(true);
    setSendError(null);
    setResponse(null);

    const start = Date.now();
    try {
      const params = new URLSearchParams();
      queryParams.forEach(({ key, value }) => {
        if (key) params.set(key, value);
      });
      const url = `${API_URL}/data/${selectedSlug}${params.toString() ? '?' + params.toString() : ''}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawKey}`,
        },
        ...(body && (method === 'POST' || method === 'PATCH')
          ? { body }
          : {}),
      });

      const latencyMs = Date.now() - start;
      const data = await res.json().catch(() => null);

      setResponse({ status: res.status, data, latencyMs });
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (keyLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <CodeOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          API Key Tester
        </Title>
        <Text type="secondary">Test your API key: <Text code>{apiKey?.keyPrefix}...</Text> — {apiKey?.name}</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {/* Raw key input */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              API Key (paste full key)
            </Text>
            <Input.Password
              placeholder="dmds_live_... or dmds_sandbox_..."
              value={rawKey}
              onChange={(e) => setRawKey(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
            <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
              The full key was shown once at creation. This is never sent to our servers — only to your API.
            </Text>
          </div>

          {/* Method + Module selector */}
          <Space style={{ width: '100%' }}>
            <Select
              value={method}
              onChange={handleMethodChange}
              style={{ width: 110 }}
              options={(['GET', 'POST', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => ({
                value: m,
                label: <Tag color={METHOD_COLORS[m]}>{m}</Tag>,
              }))}
            />
            <Select
              style={{ flex: 1, minWidth: 200 }}
              placeholder="Select a module..."
              value={selectedSlug || undefined}
              onChange={handleModuleChange}
              showSearch
              options={modules.map((m) => ({
                value: m.slug,
                label: `${m.name} (/${m.slug})`,
              }))}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sending}
              disabled={!selectedSlug || !rawKey}
            >
              Send
            </Button>
          </Space>

          {/* Endpoint URL preview */}
          {endpointUrl && (
            <div style={{
              background: '#f5f5f5',
              borderRadius: 6,
              padding: '8px 12px',
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#595959',
            }}>
              <Tag color={METHOD_COLORS[method]} style={{ marginRight: 8 }}>{method}</Tag>
              {endpointUrl}
            </div>
          )}
        </Space>
      </Card>

      {/* Request configuration */}
      {(method === 'POST' || method === 'PATCH') && (
        <Card title="Request Body" style={{ marginBottom: 16 }}>
          <TextArea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
            placeholder='{}'
          />
          {selectedModule && (
            <Button
              size="small"
              style={{ marginTop: 8 }}
              onClick={() => setBody(buildSchemaTemplate(selectedModule))}
            >
              Reset to schema template
            </Button>
          )}
        </Card>
      )}

      {method === 'GET' && (
        <Card title="Query Parameters" style={{ marginBottom: 16 }} size="small">
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {queryParams.map((param, i) => (
              <Space key={i}>
                <Input
                  placeholder="key"
                  value={param.key}
                  onChange={(e) => {
                    const updated = [...queryParams];
                    updated[i] = { ...updated[i], key: e.target.value };
                    setQueryParams(updated);
                  }}
                  style={{ width: 150 }}
                />
                <Input
                  placeholder="value"
                  value={param.value}
                  onChange={(e) => {
                    const updated = [...queryParams];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setQueryParams(updated);
                  }}
                  style={{ width: 200 }}
                />
                <Button
                  size="small"
                  onClick={() => setQueryParams(queryParams.filter((_, j) => j !== i))}
                >
                  ×
                </Button>
              </Space>
            ))}
            <Button size="small" onClick={() => setQueryParams([...queryParams, { key: '', value: '' }])}>
              + Add param
            </Button>
          </Space>
        </Card>
      )}

      {/* Response */}
      {sendError && (
        <Alert type="error" message="Request failed" description={sendError} style={{ marginBottom: 16 }} />
      )}

      {response && (
        <Card
          title={
            <Space>
              <Badge
                status={response.status < 300 ? 'success' : response.status < 500 ? 'warning' : 'error'}
              />
              <Tag color={response.status < 300 ? 'green' : response.status < 500 ? 'orange' : 'red'}>
                {response.status}
              </Tag>
              <Text style={{ fontSize: 13 }}>{response.latencyMs}ms</Text>
            </Space>
          }
          extra={
            <Button
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => router.push('/dashboard/logs')}
            >
              View in Logs
            </Button>
          }
        >
          {/* Stripped fields warning */}
          {(response.data as Record<string, unknown>)?.strippedFields && (
            <Alert
              type="warning"
              message={`Fields stripped by permissions: ${((response.data as Record<string, unknown>).strippedFields as string[]).join(', ')}`}
              style={{ marginBottom: 12 }}
            />
          )}
          <pre
            style={{
              background: '#1e1e2e',
              color: '#cdd6f4',
              padding: 16,
              borderRadius: 8,
              fontSize: 13,
              overflow: 'auto',
              maxHeight: 400,
              margin: 0,
            }}
          >
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
