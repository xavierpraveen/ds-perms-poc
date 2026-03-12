'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy,
  Check,
  Lock,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  Plus,
  X,
  Send,
} from 'lucide-react';
import { useApiKey } from '@/hooks/useApiKeys';
import { useModules } from '@/hooks/useModules';
import type { Module } from '@dmds/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    'text-green-400',
  POST:   'text-blue-400',
  PATCH:  'text-yellow-400',
  DELETE: 'text-red-400',
};

const METHOD_BADGE: Record<HttpMethod, string> = {
  GET:    'bg-green-100 text-green-800 border-green-200',
  POST:   'bg-blue-100  text-blue-800  border-blue-200',
  PATCH:  'bg-orange-100 text-orange-800 border-orange-200',
  DELETE: 'bg-red-100   text-red-800   border-red-200',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function buildSchemaTemplate(module: Module): string {
  const obj: Record<string, unknown> = {};
  module.fields.forEach((f) => {
    switch (f.type) {
      case 'STRING':  obj[f.name] = ''; break;
      case 'NUMBER':  obj[f.name] = 0; break;
      case 'BOOLEAN': obj[f.name] = true; break;
      case 'DATE':    obj[f.name] = new Date().toISOString(); break;
      case 'JSON':    obj[f.name] = {}; break;
      case 'ARRAY':   obj[f.name] = []; break;
    }
  });
  return JSON.stringify(obj, null, 2);
}

function buildCurl(
  method: HttpMethod,
  url: string,
  token: string,
  body: string,
  params: Array<{ key: string; value: string }>,
): string {
  const qs = params.filter((p) => p.key).map((p) => `${p.key}=${p.value}`).join('&');
  const fullUrl = url + (qs ? '?' + qs : '');
  const maskedToken = token ? token.slice(0, 12) + '...' : 'YOUR_API_KEY';
  const lines = [
    `curl --request ${method} \\`,
    `     --url '${fullUrl}' \\`,
    `     --header 'Cache-Control: no-cache' \\`,
    `     --header 'Content-Type: application/json' \\`,
    `     --header 'Authorization: Bearer ${maskedToken}'`,
  ];
  if (body && (method === 'POST' || method === 'PATCH')) {
    lines[lines.length - 1] += ' \\';
    lines.push(`     --data '${body.replace(/\n/g, '')}'`);
  }
  return lines.join('\n');
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
      {children}
    </p>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-slate-400 hover:text-white transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function StatusBadge({ status }: { status: number }) {
  const isOk  = status < 300;
  const isWarn = status < 500;
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold border',
        isOk   ? 'bg-green-50  text-green-700  border-green-200' :
        isWarn ? 'bg-orange-50 text-orange-700 border-orange-200' :
                 'bg-red-50    text-red-700    border-red-200',
      ].join(' ')}
    >
      <span
        className={[
          'h-2 w-2 rounded-full',
          isOk   ? 'bg-green-500' :
          isWarn ? 'bg-orange-500' : 'bg-red-500',
        ].join(' ')}
      />
      {status} — {isOk ? 'Result' : isWarn ? 'Client Error' : 'Server Error'}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ApiKeyTesterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const { data: apiKey, isLoading: keyLoading } = useApiKey(id);
  const { data: modules = [] } = useModules();

  const [rawKey,       setRawKey]       = useState('');
  const [showKey,      setShowKey]      = useState(false);
  const [method,       setMethod]       = useState<HttpMethod>('GET');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [body,         setBody]         = useState('');
  const [queryParams,  setQueryParams]  = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);
  const [response,  setResponse]  = useState<{ status: number; data: unknown; latencyMs: number } | null>(null);
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const selectedModule = modules.find((m) => m.slug === selectedSlug);
  const endpointUrl    = selectedSlug ? `${API_URL}/data/${selectedSlug}` : `${API_URL}/data/{module}`;

  const curlText = useMemo(
    () => buildCurl(method, endpointUrl, rawKey, body, queryParams),
    [method, endpointUrl, rawKey, body, queryParams],
  );

  const handleModuleChange = (slug: string) => {
    setSelectedSlug(slug);
    const mod = modules.find((m) => m.slug === slug);
    if (mod && (method === 'POST' || method === 'PATCH')) setBody(buildSchemaTemplate(mod));
  };

  const handleMethodChange = (m: HttpMethod) => {
    setMethod(m);
    if ((m === 'POST' || m === 'PATCH') && selectedModule) setBody(buildSchemaTemplate(selectedModule));
    else if (m === 'GET' || m === 'DELETE') setBody('');
  };

  const handleSend = async () => {
    if (!selectedSlug || !rawKey) return;
    setSending(true);
    setSendError(null);
    setResponse(null);
    const start = Date.now();
    try {
      const qs = queryParams.filter((p) => p.key).map((p) => `${p.key}=${p.value}`).join('&');
      const url = `${API_URL}/data/${selectedSlug}${qs ? '?' + qs : ''}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawKey}`,
        },
        ...(body && (method === 'POST' || method === 'PATCH') ? { body } : {}),
      });
      const data = await res.json().catch(() => null);
      setResponse({ status: res.status, data, latencyMs: Date.now() - start });
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (keyLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const responseJson = JSON.stringify(response?.data, null, 2) ?? '';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold">API Key Tester</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Interactive console for{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            {apiKey?.keyPrefix}...
          </code>{' '}
          — {apiKey?.name}
        </p>
      </div>

      {/* ── Credentials ────────────────────────────────────────────────────── */}
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/40">
          <SectionLabel>Credentials</SectionLabel>
          <div className="flex items-center gap-0 rounded-lg border overflow-hidden bg-background">
            {/* API Key pill */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-r bg-muted text-sm font-medium text-muted-foreground select-none">
              API Key
            </div>
            {/* Key input */}
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="dmds_live_... or dmds_sandbox_..."
              value={rawKey}
              onChange={(e) => setRawKey(e.target.value)}
              className="flex-1 px-3 py-2 text-sm font-mono bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
            {/* Icons */}
            <button
              onClick={() => setShowKey((v) => !v)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Stored locally only">
              <Lock className="h-4 w-4" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Your API key is only used client-side and never sent to our servers">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Request builder ─────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={method} onValueChange={(v) => handleMethodChange(v as HttpMethod)}>
              <SelectTrigger className="w-[105px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['GET', 'POST', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className={`text-xs font-bold ${METHOD_COLORS[m]}`}>{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSlug || undefined} onValueChange={handleModuleChange}>
              <SelectTrigger className="flex-1 min-w-[180px]">
                <SelectValue placeholder="Select a module…" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.slug} value={m.slug}>
                    {m.name}
                    <span className="ml-1.5 text-muted-foreground text-xs">/{m.slug}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Query params ────────────────────────────────────────────────── */}
        {method === 'GET' && (
          <div className="px-4 py-3 border-b space-y-2">
            <SectionLabel>Query Parameters</SectionLabel>
            {queryParams.map((param, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="key"
                  value={param.key}
                  onChange={(e) => {
                    const u = [...queryParams];
                    u[i] = { ...u[i], key: e.target.value };
                    setQueryParams(u);
                  }}
                  className="w-32 h-8 text-sm font-mono"
                />
                <Input
                  placeholder="value"
                  value={param.value}
                  onChange={(e) => {
                    const u = [...queryParams];
                    u[i] = { ...u[i], value: e.target.value };
                    setQueryParams(u);
                  }}
                  className="w-44 h-8 text-sm font-mono"
                />
                <button
                  onClick={() => setQueryParams(queryParams.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setQueryParams([...queryParams, { key: '', value: '' }])}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add param
            </button>
          </div>
        )}

        {/* ── Request body ────────────────────────────────────────────────── */}
        {(method === 'POST' || method === 'PATCH') && (
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Request Body</SectionLabel>
              {selectedModule && (
                <button
                  onClick={() => setBody(buildSchemaTemplate(selectedModule))}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset to schema
                </button>
              )}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="font-mono text-sm bg-[#1e1e2e] text-[#cdd6f4] border-slate-700 focus-visible:ring-slate-500 resize-none"
              placeholder="{}"
            />
          </div>
        )}

        {/* ── cURL Preview ────────────────────────────────────────────────── */}
        <div className="bg-[#1a1b26]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">cURL Request</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <CopyButton text={curlText.replace('...', '')} />
          </div>
          <pre className="px-4 py-4 text-[13px] leading-6 overflow-x-auto text-slate-300 font-mono">
            {curlText.split('\n').map((line, i) => {
              // Colour the method word
              const methodMatch = line.match(/^(curl --request )(\w+)(.*)/);
              if (methodMatch) {
                const [, pre, meth, rest] = methodMatch;
                return (
                  <div key={i}>
                    <span className="text-[#7dcfff]">curl</span>
                    <span className="text-slate-300"> --request </span>
                    <span className={METHOD_COLORS[meth as HttpMethod] ?? 'text-white'}>
                      {meth}
                    </span>
                    <span className="text-slate-300">{rest}</span>
                  </div>
                );
              }
              // Colour --header key
              if (line.includes('--header')) {
                const m = line.match(/^(\s+)(--header )(')(.*?:)(.*?)('.*)/);
                if (m) {
                  return (
                    <div key={i}>
                      <span>{m[1]}</span>
                      <span className="text-[#7dcfff]">--header</span>
                      <span> </span>
                      <span className="text-[#e0af68]">{m[3]}{m[4]}</span>
                      <span className="text-[#9ece6a]">{m[5]}</span>
                      <span className="text-[#e0af68]">{m[6]}</span>
                    </div>
                  );
                }
              }
              // --url line
              if (line.includes('--url')) {
                const m = line.match(/^(\s+)(--url )('.*')/);
                if (m) return (
                  <div key={i}>
                    <span>{m[1]}</span>
                    <span className="text-[#7dcfff]">--url</span>
                    <span> </span>
                    <span className="text-[#9ece6a]">{m[3]}</span>
                  </div>
                );
              }
              return <div key={i}>{line}</div>;
            })}
          </pre>

          {/* Try It! button */}
          <div className="flex items-center justify-end px-4 pb-4">
            <Button
              onClick={handleSend}
              disabled={sending || !selectedSlug || !rawKey}
              className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 gap-2"
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-900" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Try It!
            </Button>
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {sendError && (
        <div className="border border-destructive/30 rounded-xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <strong>Request failed:</strong> {sendError}
        </div>
      )}

      {/* ── Response ───────────────────────────────────────────────────────── */}
      {response && (
        <div className="border rounded-xl overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <StatusBadge status={response.status} />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{response.latencyMs}ms</span>
            </div>
            <CopyButton text={responseJson} />
          </div>

          {/* Stripped fields notice */}
          {(response.data as Record<string, unknown>)?.strippedFields && (
            <div className="px-4 py-2 border-b bg-amber-50 text-amber-800 text-xs">
              Fields stripped by permissions:{' '}
              <strong>
                {((response.data as Record<string, unknown>).strippedFields as string[]).join(', ')}
              </strong>
            </div>
          )}

          {/* JSON body */}
          <div className="bg-[#1a1b26] relative">
            <pre className="px-4 py-5 text-[13px] leading-6 overflow-auto max-h-[480px] font-mono text-[#cdd6f4]">
              {responseJson.split('\n').map((line, i) => {
                // Colour JSON keys vs values
                const keyMatch = line.match(/^(\s*)(".*?")(:\s*)(.*)/);
                if (keyMatch) {
                  const [, indent, key, colon, val] = keyMatch;
                  const isStr  = val.startsWith('"');
                  const isNum  = /^-?\d/.test(val);
                  const isBool = val === 'true' || val === 'false' || val === 'null' || val === 'null,';
                  return (
                    <div key={i}>
                      <span>{indent}</span>
                      <span className="text-[#7dcfff]">{key}</span>
                      <span className="text-slate-400">{colon}</span>
                      <span className={isStr ? 'text-[#9ece6a]' : isNum ? 'text-[#ff9e64]' : isBool ? 'text-[#bb9af7]' : 'text-slate-300'}>
                        {val}
                      </span>
                    </div>
                  );
                }
                return <div key={i} className="text-slate-500">{line}</div>;
              })}
            </pre>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
            <span>Response received</span>
            <button
              onClick={() => router.push('/dashboard/logs')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              View in Logs →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
