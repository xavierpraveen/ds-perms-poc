'use client';

import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CreateModuleFieldDto, FieldType } from '@dmds/types';

const FIELD_TYPES: { value: string; label: string; className: string }[] = [
  { value: 'STRING',  label: 'String',  className: 'bg-blue-100   text-blue-700'   },
  { value: 'NUMBER',  label: 'Number',  className: 'bg-green-100  text-green-700'  },
  { value: 'BOOLEAN', label: 'Boolean', className: 'bg-purple-100 text-purple-700' },
  { value: 'DATE',    label: 'Date',    className: 'bg-orange-100 text-orange-700' },
  { value: 'JSON',    label: 'JSON',    className: 'bg-cyan-100   text-cyan-700'   },
  { value: 'ARRAY',   label: 'Array',   className: 'bg-pink-100   text-pink-700'   },
];

const TYPE_CLASS: Record<string, string> = Object.fromEntries(
  FIELD_TYPES.map((t) => [t.value, t.className]),
);

interface ModuleFieldBuilderProps {
  fields: CreateModuleFieldDto[];
  onChange: (fields: CreateModuleFieldDto[]) => void;
}

const emptyField = (): CreateModuleFieldDto => ({
  name: '',
  type: 'STRING' as FieldType,
  required: false,
  sensitive: false,
  order: 0,
});

export default function ModuleFieldBuilder({ fields, onChange }: ModuleFieldBuilderProps) {
  const addField = () => {
    onChange([...fields, { ...emptyField(), order: fields.length }]);
  };

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, patch: Partial<CreateModuleFieldDto>) => {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Header row */}
        {fields.length > 0 && (
          <div className="grid grid-cols-[1fr_140px_80px_80px_32px] gap-2 pl-8 pr-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Field Name</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Type</span>
            <span className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Required</span>
            <span className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sensitive</span>
            <span />
          </div>
        )}

        {fields.map((field, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[24px_1fr_140px_80px_80px_32px] items-center gap-2 rounded-md border bg-muted/30 px-2 py-2"
          >
            {/* Drag handle (visual only) */}
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/40" />

            {/* Field name */}
            <Input
              placeholder="field_name"
              value={field.name}
              onChange={(e) => updateField(idx, { name: e.target.value })}
              className="h-7 font-mono text-[13px]"
            />

            {/* Type selector */}
            <Select
              value={field.type}
              onValueChange={(val) => updateField(idx, { type: val as FieldType })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] font-normal ${TYPE_CLASS[field.type] ?? ''}`}
                  >
                    {field.type}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] font-normal ${t.className}`}
                    >
                      {t.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Required toggle */}
            <div className="flex justify-center">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => updateField(idx, { required: checked })}
                className="scale-90"
              />
            </div>

            {/* Sensitive toggle */}
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Switch
                      checked={field.sensitive}
                      onCheckedChange={(checked) => updateField(idx, { sensitive: checked })}
                      className="scale-90"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Mark this field as sensitive (e.g. PII data)
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeField(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          className="mt-1 w-full border-dashed"
          onClick={addField}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>
    </TooltipProvider>
  );
}
