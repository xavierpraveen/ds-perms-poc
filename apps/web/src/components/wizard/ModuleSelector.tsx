'use client';

import type { Module } from '@dmds/types';
import { Badge } from '@/components/ui/badge';

interface ModuleSelectorProps {
  modules: Module[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function ModuleSelector({ modules, selectedIds, onChange }: ModuleSelectorProps) {
  if (!modules.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">
          No modules yet.{' '}
          <a href="/dashboard/modules/new" className="text-primary underline underline-offset-4 hover:opacity-80">
            Create a module
          </a>{' '}
          first.
        </p>
      </div>
    );
  }

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Select Modules</p>
        <p className="text-sm text-muted-foreground mb-4">
          Choose which modules this API key can access. You'll configure permissions in the next step.
        </p>
      </div>

      <div className="grid gap-2">
        {modules.map((m) => {
          const selected = selectedIds.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className={[
                'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors',
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/50',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                {/* checkbox indicator */}
                <div
                  className={[
                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    selected ? 'border-primary bg-primary' : 'border-muted-foreground',
                  ].join(' ')}
                >
                  {selected && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {m.environment === 'PRODUCTION' ? 'Prod' : 'Sandbox'}
                </Badge>
                <span className="text-xs text-muted-foreground">{m.fields.length} fields</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground pt-1">
          {selectedIds.length} module{selectedIds.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
