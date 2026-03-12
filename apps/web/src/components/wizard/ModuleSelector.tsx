'use client';

import { useState, useMemo } from 'react';
import type { Module } from '@dmds/types';

interface ModuleSelectorProps {
  modules: Module[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const ENV_STYLES = {
  PRODUCTION: {
    dot: 'bg-emerald-500',
    label: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    text: 'Prod',
  },
  SANDBOX: {
    dot: 'bg-sky-400',
    label: 'text-sky-700 bg-sky-50 border-sky-200',
    text: 'Sandbox',
  },
};

const FIELD_TYPE_COLORS: Record<string, string> = {
  STRING: 'text-violet-600 bg-violet-50',
  NUMBER: 'text-amber-600 bg-amber-50',
  BOOLEAN: 'text-rose-600 bg-rose-50',
  DATE: 'text-blue-600 bg-blue-50',
  JSON: 'text-teal-600 bg-teal-50',
  ARRAY: 'text-orange-600 bg-orange-50',
};

export default function ModuleSelector({ modules, selectedIds, onChange }: ModuleSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return modules;
    const q = query.toLowerCase();
    return modules.filter(
      (m) => m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q),
    );
  }, [modules, query]);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id],
    );
  };

  const toggleAll = () => {
    const allFilteredSelected = filtered.every((m) => selectedIds.includes(m.id));
    if (allFilteredSelected) {
      onChange(selectedIds.filter((id) => !filtered.find((m) => m.id === id)));
    } else {
      const toAdd = filtered.map((m) => m.id).filter((id) => !selectedIds.includes(id));
      onChange([...selectedIds, ...toAdd]);
    }
  };

  if (!modules.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No modules yet</p>
        <p className="text-sm text-muted-foreground">
          <a href="/dashboard/modules/new" className="text-primary underline underline-offset-4 hover:opacity-80">
            Create a module
          </a>{' '}
          to get started.
        </p>
      </div>
    );
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selectedIds.includes(m.id));

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Select Modules</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose which modules this API key can access
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 border border-primary/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {selectedIds.length} selected
            </span>
          )}
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          placeholder="Search by name or slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Module list */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No modules match &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const selected = selectedIds.includes(m.id);
            const envStyle = ENV_STYLES[m.environment] ?? ENV_STYLES.PRODUCTION;
            const previewFields = m.fields.slice(0, 5);
            const overflow = m.fields.length - previewFields.length;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={[
                  'w-full text-left rounded-xl border transition-all duration-150 group',
                  selected
                    ? 'border-primary/40 bg-primary/[0.03] shadow-sm ring-1 ring-primary/20'
                    : 'border-border bg-card hover:border-border/80 hover:bg-muted/30',
                ].join(' ')}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Checkbox indicator */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={[
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                        selected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/40 group-hover:border-muted-foreground/70',
                      ].join(' ')}
                    >
                      {selected && (
                        <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-sm font-semibold text-foreground">{m.name}</span>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono border border-border/60">
                        {m.slug}
                      </code>
                      <span
                        className={[
                          'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded border',
                          envStyle.label,
                        ].join(' ')}
                      >
                        <span className={['w-1.5 h-1.5 rounded-full', envStyle.dot].join(' ')} />
                        {envStyle.text}
                      </span>
                    </div>

                    {/* Field preview */}
                    {m.fields.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {previewFields.map((f) => (
                          <span
                            key={f.id}
                            className={[
                              'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-mono',
                              FIELD_TYPE_COLORS[f.type] ?? 'text-muted-foreground bg-muted',
                            ].join(' ')}
                          >
                            {f.name}
                          </span>
                        ))}
                        {overflow > 0 && (
                          <span className="text-xs text-muted-foreground">+{overflow} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No fields defined</span>
                    )}
                  </div>

                  {/* Field count */}
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {m.fields.length} field{m.fields.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
