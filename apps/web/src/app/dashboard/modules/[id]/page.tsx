'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModule, useUpdateModule } from '@/hooks/useModules';
import ModuleFieldBuilder from '@/components/modules/ModuleFieldBuilder';
import type { CreateModuleFieldDto, FieldType } from '@dmds/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!module) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Not found</AlertTitle>
        <AlertDescription>Module not found</AlertDescription>
      </Alert>
    );
  }

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
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Module — {module.name}</h1>
        <p className="font-mono text-sm text-muted-foreground">/{module.slug}</p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Module Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Schema Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            To edit fields, delete and recreate them or use the API. Existing permissions will be preserved.
          </p>
          <ModuleFieldBuilder fields={fields} onChange={() => {}} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateModule.isPending}>
          {updateModule.isPending && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
