'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Code, ArrowRight } from 'lucide-react';
import { useApiKey } from '@/hooks/useApiKeys';
import { useModules } from '@/hooks/useModules';
import type { Module } from '@dmds/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const METHOD_BADGE_CLASS: Record<HttpMethod, string> = {
  GET: 'bg-green-100 text-green-800 border-green-200',
  POST: 'bg-blue-100 text-blue-800 border-blue-200',
  PATCH: 'bg-orange-100 text-orange-800 border-orange-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
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
  const [showKey, setShowKey] = useState(false);
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

  const endpointUrl = selectedSlug ? `${API_URL}/data/${selectedSlug}` : '';

  const handleSend = async () => {
    if (!selectedSlug || !rawKey) return;
    setSending(true);
    setSendError(null);
    setResponse(null);

    const start = Date.now();
    try {
      const searchParams = new URLSearchParams();
      queryParams.forEach(({ key, value }) => {
        if (key) searchParams.set(key, value);
      });
      const url = `${API_URL}/data/${selectedSlug}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawKey}`,
        },
        ...(body && (method === 'POST' || method === 'PATCH') ? { body } : {}),
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

  if (keyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const statusBadgeClass =
    response && response.status < 300
      ? 'bg-green-100 text-green-800 border-green-200'
      : response && response.status < 500
        ? 'bg-orange-100 text-orange-800 border-orange-200'
        : 'bg-red-100 text-red-800 border-red-200';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Code className="h-6 w-6 text-blue-500" />
          API Key Tester
        </h1>
        <p className="text-sm text-muted-foreground">
          Test your API key:{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            {apiKey?.keyPrefix}...
          </code>{' '}
          — {apiKey?.name}
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          {/* Raw key input */}
          <div>
            <label className="block text-sm font-medium mb-1.5">API Key (paste full key)</label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="dmds_live_... or dmds_sandbox_..."
                value={rawKey}
                onChange={(e) => setRawKey(e.target.value)}
                className="font-mono pr-20"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              The full key was shown once at creation. This is never sent to our servers — only to your API.
            </p>
          </div>

          {/* Method + Module selector + Send */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={method} onValueChange={(v) => handleMethodChange(v as HttpMethod)}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['GET', 'POST', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${METHOD_BADGE_CLASS[m]}`}>
                      {m}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSlug || undefined} onValueChange={handleModuleChange}>
              <SelectTrigger className="flex-1 min-w-[200px]">
                <SelectValue placeholder="Select a module..." />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.slug} value={m.slug}>
                    {m.name} (/{m.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleSend}
              disabled={sending || !selectedSlug || !rawKey}
            >
              {sending ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>

          {/* Endpoint URL preview */}
          {endpointUrl && (
            <div className="bg-muted rounded-md px-3 py-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${METHOD_BADGE_CLASS[method]}`}>
                {method}
              </span>
              {endpointUrl}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request body */}
      {(method === 'POST' || method === 'PATCH') && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Request Body</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              placeholder="{}"
            />
            {selectedModule && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setBody(buildSchemaTemplate(selectedModule))}
              >
                Reset to schema template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Query params */}
      {method === 'GET' && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Query Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {queryParams.map((param, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="key"
                  value={param.key}
                  onChange={(e) => {
                    const updated = [...queryParams];
                    updated[i] = { ...updated[i], key: e.target.value };
                    setQueryParams(updated);
                  }}
                  className="w-36"
                />
                <Input
                  placeholder="value"
                  value={param.value}
                  onChange={(e) => {
                    const updated = [...queryParams];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setQueryParams(updated);
                  }}
                  className="w-48"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQueryParams(queryParams.filter((_, j) => j !== i))}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQueryParams([...queryParams, { key: '', value: '' }])}
            >
              + Add param
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {sendError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>{sendError}</AlertDescription>
        </Alert>
      )}

      {/* Response */}
      {response && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    response.status < 300
                      ? 'bg-green-500'
                      : response.status < 500
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                  }`}
                />
                <Badge variant="outline" className={statusBadgeClass}>
                  {response.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{response.latencyMs}ms</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/logs')}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                View in Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(response.data as Record<string, unknown>)?.strippedFields && (
              <Alert className="mb-3">
                <AlertDescription>
                  Fields stripped by permissions:{' '}
                  {(
                    (response.data as Record<string, unknown>).strippedFields as string[]
                  ).join(', ')}
                </AlertDescription>
              </Alert>
            )}
            <Separator className="mb-3" />
            <pre className="bg-[#1e1e2e] text-[#cdd6f4] p-4 rounded-lg text-sm overflow-auto max-h-96 m-0">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
