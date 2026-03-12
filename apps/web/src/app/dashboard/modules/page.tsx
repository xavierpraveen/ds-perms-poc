'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Boxes, Edit, Trash2, X,
  Calendar, Hash, Tag, ChevronRight,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

/* ─── Constants ──────────────────────────────────────────────────────────── */
const FIELD_TYPE_COLORS: Record<string, string> = {
  STRING:  'bg-blue-100   text-blue-700',
  NUMBER:  'bg-green-100  text-green-700',
  BOOLEAN: 'bg-purple-100 text-purple-700',
  DATE:    'bg-orange-100 text-orange-700',
  JSON:    'bg-cyan-100   text-cyan-700',
  ARRAY:   'bg-pink-100   text-pink-700',
};

const FIELD_TYPE_FULL: Record<string, string> = {
  STRING:  'bg-blue-50   text-blue-600   border-blue-200',
  NUMBER:  'bg-green-50  text-green-600  border-green-200',
  BOOLEAN: 'bg-purple-50 text-purple-600 border-purple-200',
  DATE:    'bg-orange-50 text-orange-600 border-orange-200',
  JSON:    'bg-cyan-50   text-cyan-600   border-cyan-200',
  ARRAY:   'bg-pink-50   text-pink-600   border-pink-200',
};

/* ─── Delete button ───────────────────────────────────────────────────────── */
function DeleteButton({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const deleteMutation = useDeleteModule(id);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => e.stopPropagation()}
        >
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
            onClick={() => { deleteMutation.mutate(); onDeleted?.(); }}
          >
            {deleteMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting…
              </span>
            ) : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─── Module detail drawer ───────────────────────────────────────────────── */
function ModuleDrawer({
  module,
  open,
  onClose,
}: {
  module: Module | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!module) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-semibold leading-snug truncate">
                {module.name}
              </SheetTitle>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  /{module.slug}
                </code>
                <Badge
                  variant="outline"
                  className={
                    module.environment === 'PRODUCTION'
                      ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                      : 'bg-blue-50 text-blue-700 border-blue-200 text-xs'
                  }
                >
                  {module.environment === 'PRODUCTION' ? 'Production' : 'Sandbox'}
                </Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Description */}
          {module.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Description
              </p>
              <p className="text-sm text-foreground">{module.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <Hash className="h-3.5 w-3.5" />
                Fields
              </div>
              <p className="text-lg font-semibold">{module.fields.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <Calendar className="h-3.5 w-3.5" />
                Created
              </div>
              <p className="text-sm font-medium">
                {new Date(module.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Fields list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Schema Fields
            </p>
            <div className="space-y-2">
              {module.fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5"
                >
                  {/* Order number */}
                  <span className="text-xs text-muted-foreground w-4 shrink-0 text-center font-mono">
                    {idx + 1}
                  </span>

                  {/* Field name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono font-medium truncate">{field.name}</code>
                      {field.required && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 leading-none">
                          required
                        </span>
                      )}
                      {field.sensitive && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 bg-rose-50 border border-rose-200 rounded px-1 py-0.5 leading-none">
                          sensitive
                        </span>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {field.description}
                      </p>
                    )}
                  </div>

                  {/* Type badge */}
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono shrink-0 ${FIELD_TYPE_FULL[field.type] ?? ''}`}
                  >
                    {field.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Endpoint preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              API Endpoint
            </p>
            <div className="rounded-lg bg-slate-900 px-3 py-3 font-mono text-xs space-y-1.5">
              {(['GET', 'POST', 'PATCH', 'DELETE'] as const).map((m) => (
                <div key={m} className="flex items-center gap-2">
                  <span className={`w-12 font-bold ${
                    m === 'GET'    ? 'text-green-400' :
                    m === 'POST'   ? 'text-blue-400'  :
                    m === 'PATCH'  ? 'text-yellow-400' :
                                     'text-red-400'
                  }`}>{m}</span>
                  <span className="text-slate-400">/api/data/</span>
                  <span className="text-slate-200">{module.slug}</span>
                  {(m === 'PATCH' || m === 'DELETE') && (
                    <span className="text-slate-500">/:id</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t px-6 py-4 flex items-center gap-2 bg-background">
          <Button
            className="flex-1"
            onClick={() => { onClose(); router.push(`/dashboard/modules/${module.id}`); }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Module
          </Button>
          <DeleteButton id={module.id} onDeleted={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Table ───────────────────────────────────────────────────────────────── */
function ModulesTable({
  modules,
  onRowClick,
}: {
  modules: Module[];
  onRowClick: (m: Module) => void;
}) {
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
            <tr
              key={module.id}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => onRowClick(module)}
            >
              <td className="px-4 py-3">
                <div className="font-medium group-hover:text-primary transition-colors">
                  {module.name}
                </div>
                <div className="mt-0.5 font-mono text-xs text-muted-foreground">/{module.slug}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground max-w-[240px] truncate">
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
                      {f.sensitive ? ' 🔒' : ''}
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
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ModulesPage() {
  const router = useRouter();
  const [env, setEnv]                       = useState<Environment | undefined>();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const { data: modules = [], isLoading, error } = useModules(env);

  const prod    = modules.filter((m) => m.environment === 'PRODUCTION');
  const sandbox = modules.filter((m) => m.environment === 'SANDBOX');

  const openDrawer = (m: Module) => {
    setSelectedModule(m);
    setDrawerOpen(true);
  };

  return (
    <div>
      {/* Header */}
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
          <Database className="mb-4 h-14 w-14 text-muted-foreground/30" />
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
            <ModulesTable modules={modules} onRowClick={openDrawer} />
          </TabsContent>
          <TabsContent value="production">
            <ModulesTable modules={prod} onRowClick={openDrawer} />
          </TabsContent>
          <TabsContent value="sandbox">
            <ModulesTable modules={sandbox} onRowClick={openDrawer} />
          </TabsContent>
        </Tabs>
      )}

      {/* Detail drawer */}
      <ModuleDrawer
        module={selectedModule}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
