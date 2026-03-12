'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Boxes, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useModules, useDeleteModule } from '@/hooks/useModules';
import type { Module, Environment } from '@dmds/types';

const FIELD_TYPE_COLORS: Record<string, string> = {
  STRING: 'bg-blue-100 text-blue-700',
  NUMBER: 'bg-green-100 text-green-700',
  BOOLEAN: 'bg-purple-100 text-purple-700',
  DATE: 'bg-orange-100 text-orange-700',
  JSON: 'bg-cyan-100 text-cyan-700',
  ARRAY: 'bg-pink-100 text-pink-700',
};

function DeleteButton({ id }: { id: string }) {
  const deleteMutation = useDeleteModule(id);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this module?</AlertDialogTitle>
          <AlertDialogDescription>
            All associated records and permissions will be deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting…
              </span>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ModulesTable({ modules }: { modules: Module[] }) {
  const router = useRouter();

  if (!modules.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Boxes className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No modules in this environment yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fields</th>
            <th className="w-28 px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
            <th className="w-20 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium">{module.name}</div>
                <div className="mt-0.5 font-mono text-xs text-muted-foreground">/{module.slug}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {module.description || <span className="text-xs">—</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {module.fields.slice(0, 4).map((f) => (
                    <Badge
                      key={f.id}
                      variant="secondary"
                      className={`text-xs font-normal ${FIELD_TYPE_COLORS[f.type] ?? ''}`}
                    >
                      {f.name}
                      {f.sensitive ? ' \uD83D\uDD12' : ''}
                    </Badge>
                  ))}
                  {module.fields.length > 4 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      +{module.fields.length - 4}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(module.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => router.push(`/dashboard/modules/${module.id}`)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <DeleteButton id={module.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModulesPage() {
  const router = useRouter();
  const [env, setEnv] = useState<Environment | undefined>();
  const { data: modules = [], isLoading, error } = useModules(env);

  const prod = modules.filter((m) => m.environment === 'PRODUCTION');
  const sandbox = modules.filter((m) => m.environment === 'SANDBOX');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Boxes className="h-6 w-6 text-blue-500" />
            Dynamic Modules
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the data schemas your API keys can access
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/modules/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Failed to load modules</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !modules.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Boxes className="mb-4 h-14 w-14 text-muted-foreground/30" />
          <p className="mb-2 text-base font-medium">No modules yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first module to get started.
          </p>
          <Button onClick={() => router.push('/dashboard/modules/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Module
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({modules.length})</TabsTrigger>
            <TabsTrigger value="production">Production ({prod.length})</TabsTrigger>
            <TabsTrigger value="sandbox">Sandbox ({sandbox.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <ModulesTable modules={modules} />
          </TabsContent>
          <TabsContent value="production">
            <ModulesTable modules={prod} />
          </TabsContent>
          <TabsContent value="sandbox">
            <ModulesTable modules={sandbox} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
