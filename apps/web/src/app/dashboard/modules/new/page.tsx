'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateModule } from '@/hooks/useModules';
import ModuleFieldBuilder from '@/components/modules/ModuleFieldBuilder';
import type { CreateModuleFieldDto, FieldType, Environment } from '@dmds/types';

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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Create Module</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define a new dynamic data module with a custom schema
        </p>
      </div>

      {/* Module metadata */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Module Name</label>
              <Input
                placeholder="e.g. Customers, Products, Orders"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Input
                placeholder="What does this module store?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Environment</label>
              <Select
                value={environment}
                onValueChange={(val) => setEnvironment(val as Environment)}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCTION">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Production
                    </span>
                  </SelectItem>
                  <SelectItem value="SANDBOX">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Sandbox
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schema fields */}
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Schema Fields</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="visual">Visual Builder</TabsTrigger>
              <TabsTrigger value="json">Raw JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="visual">
              <ModuleFieldBuilder fields={fields} onChange={setFields} />
            </TabsContent>
            <TabsContent value="json">
              <div className="space-y-3">
                {jsonError && (
                  <Alert variant="warning">
                    <AlertDescription>{jsonError}</AlertDescription>
                  </Alert>
                )}
                <Textarea
                  value={jsonValue}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={20}
                  className="font-mono text-[13px]"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || createModule.isPending}
        >
          {createModule.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating…
            </span>
          ) : (
            'Create Module'
          )}
        </Button>
      </div>
    </div>
  );
}
