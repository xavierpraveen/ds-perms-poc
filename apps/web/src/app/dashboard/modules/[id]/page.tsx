'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useModule,
  useUpdateModule,
  useAddField,
  useDeleteField,
  useUpdateField,
} from '@/hooks/useModules';
import { FieldType } from '@dmds/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { ArrowLeft, Plus, Trash2, Check, X, Pencil } from 'lucide-react';

const FIELD_TYPES: { value: FieldType; label: string; colorClass: string }[] = [
  { value: FieldType.STRING,  label: 'String',  colorClass: 'bg-blue-100 text-blue-700'   },
  { value: FieldType.NUMBER,  label: 'Number',  colorClass: 'bg-green-100 text-green-700' },
  { value: FieldType.BOOLEAN, label: 'Boolean', colorClass: 'bg-purple-100 text-purple-700' },
  { value: FieldType.DATE,    label: 'Date',    colorClass: 'bg-orange-100 text-orange-700' },
  { value: FieldType.JSON,    label: 'JSON',    colorClass: 'bg-cyan-100 text-cyan-700'   },
  { value: FieldType.ARRAY,   label: 'Array',   colorClass: 'bg-pink-100 text-pink-700'   },
];
const TYPE_COLOR: Record<string, string> = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.colorClass]));

/* ─── Add field inline form ───────────────────────────────────────────────── */
function AddFieldRow({
  moduleId,
  onAdded,
}: {
  moduleId: string;
  onAdded: () => void;
}) {
  const addField = useAddField(moduleId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>(FieldType.STRING);
  const [required, setRequired] = useState(false);
  const [sensitive, setSensitive] = useState(false);

  const reset = () => { setName(''); setType(FieldType.STRING); setRequired(false); setSensitive(false); setOpen(false); };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await addField.mutateAsync({ name: name.trim(), type, required, sensitive });
    onAdded();
    reset();
  };

  if (!open) {
    return (
      <Button variant="outline" className="w-full border-dashed mt-2" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Field
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 mt-2 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Field</p>
      <div className="grid grid-cols-[1fr_140px] gap-2">
        <Input
          autoFocus
          placeholder="field_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') reset(); }}
          className="h-8 font-mono text-sm"
        />
        <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue>
              <Badge variant="secondary" className={`text-[11px] font-normal ${TYPE_COLOR[type] ?? ''}`}>{type}</Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <Badge variant="secondary" className={`text-[11px] font-normal ${t.colorClass}`}>{t.label}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch checked={required} onCheckedChange={setRequired} className="scale-90" />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch checked={sensitive} onCheckedChange={setSensitive} className="scale-90" />
          Sensitive
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || addField.isPending}>
          {addField.isPending ? (
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />Adding…</span>
          ) : (
            <><Check className="h-3.5 w-3.5 mr-1.5" />Add Field</>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <X className="h-3.5 w-3.5 mr-1.5" />Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─── Inline-editable field row ───────────────────────────────────────────── */
function FieldRow({
  moduleId,
  field,
}: {
  moduleId: string;
  field: { id: string; name: string; type: string; required: boolean; sensitive: boolean; order: number };
}) {
  const deleteField = useDeleteField(moduleId, field.id);
  const updateField = useUpdateField(moduleId, field.id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(field.name);
  const [type, setType] = useState<FieldType>(field.type as FieldType);
  const [required, setRequired] = useState(field.required);
  const [sensitive, setSensitive] = useState(field.sensitive);

  const handleSave = async () => {
    await updateField.mutateAsync({ name: name.trim(), type, required, sensitive });
    setEditing(false);
  };
  const handleCancel = () => {
    setName(field.name); setType(field.type as FieldType);
    setRequired(field.required); setSensitive(field.sensitive);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border bg-background px-3 py-3 space-y-3">
        <div className="grid grid-cols-[1fr_140px] gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            className="h-8 font-mono text-sm"
          />
          <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue>
                <Badge variant="secondary" className={`text-[11px] font-normal ${TYPE_COLOR[type] ?? ''}`}>{type}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <Badge variant="secondary" className={`text-[11px] font-normal ${t.colorClass}`}>{t.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch checked={required} onCheckedChange={setRequired} className="scale-90" />
            Required
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch checked={sensitive} onCheckedChange={setSensitive} className="scale-90" />
            Sensitive
          </label>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || updateField.isPending}>
            {updateField.isPending
              ? <span className="flex items-center gap-1.5"><span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />Saving…</span>
              : <><Check className="h-3.5 w-3.5 mr-1.5" />Save</>
            }
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-3.5 w-3.5 mr-1.5" />Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 group">
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <code className="text-sm font-mono font-medium">{field.name}</code>
        <Badge variant="secondary" className={`text-[11px] font-normal ${TYPE_COLOR[field.type] ?? ''}`}>
          {field.type}
        </Badge>
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete field &ldquo;{field.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the field from the schema and may break existing permissions that reference it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteField.mutate()}
              >
                {deleteField.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting…
                  </span>
                ) : 'Delete Field'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
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

  const isDirty = name !== module.name || description !== (module.description || '');

  const handleSave = async () => {
    await updateModule.mutateAsync({ name, description });
    router.push('/dashboard/modules');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to modules
          </button>
          <h1 className="text-2xl font-semibold">Edit Module</h1>
          <p className="font-mono text-sm text-muted-foreground mt-0.5">/{module.slug}</p>
        </div>
      </div>

      {/* Module info card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Module Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Module Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <Input
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => router.back()} disabled={updateModule.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || updateModule.isPending || !name.trim()}>
              {updateModule.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </span>
              ) : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fields card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Schema Fields</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {module.fields.length} field{module.fields.length !== 1 ? 's' : ''} · hover a field to edit or delete it
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {module.fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No fields yet — add the first field below.
              </p>
            )}
            {module.fields.map((field) => (
              <FieldRow key={field.id} moduleId={id} field={field} />
            ))}
            <AddFieldRow moduleId={id} onAdded={() => {}} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
