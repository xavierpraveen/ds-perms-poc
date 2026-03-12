'use client';

import { useState } from 'react';
import type { Module, WizardState } from '@dmds/types';

interface ModuleAccessConfigProps {
  modules: Module[];
  modulePermissions: WizardState['modulePermissions'];
  fieldPermissions: WizardState['fieldPermissions'];
  onModulePermChange: (perms: WizardState['modulePermissions']) => void;
  onFieldPermChange: (fp: WizardState['fieldPermissions']) => void;
}

type PermKey = 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete';

const CRUD_PERMS: { key: PermKey; label: string; activeClass: string; icon: string }[] = [
  {
    key: 'canRead',
    label: 'Read',
    activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-200',
    icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    key: 'canCreate',
    label: 'Create',
    activeClass: 'bg-blue-50 text-blue-700 border-blue-300 ring-blue-200',
    icon: 'M12 4.5v15m7.5-7.5h-15',
  },
  {
    key: 'canUpdate',
    label: 'Update',
    activeClass: 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-200',
    icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z',
  },
  {
    key: 'canDelete',
    label: 'Delete',
    activeClass: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-200',
    icon: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
  },
];

const FIELD_TYPE_COLORS: Record<string, string> = {
  STRING: 'text-violet-600 bg-violet-50 border-violet-100',
  NUMBER: 'text-amber-600 bg-amber-50 border-amber-100',
  BOOLEAN: 'text-rose-600 bg-rose-50 border-rose-100',
  DATE: 'text-blue-600 bg-blue-50 border-blue-100',
  JSON: 'text-teal-600 bg-teal-50 border-teal-100',
  ARRAY: 'text-orange-600 bg-orange-50 border-orange-100',
};

function PermissionSummary({ perms }: { perms: WizardState['modulePermissions'][string] | undefined }) {
  if (!perms) return <span className="text-xs text-muted-foreground">No access</span>;
  const active = CRUD_PERMS.filter((p) => perms[p.key]);
  if (active.length === 0) return <span className="text-xs text-muted-foreground">No access</span>;
  return (
    <span className="text-xs text-muted-foreground">
      {active.map((p) => p.label).join(' · ')}
    </span>
  );
}

function ModuleCard({
  mod,
  modulePermissions,
  fieldPermissions,
  onModulePermChange,
  onFieldPermChange,
}: {
  mod: Module;
  modulePermissions: WizardState['modulePermissions'];
  fieldPermissions: WizardState['fieldPermissions'];
  onModulePermChange: (perms: WizardState['modulePermissions']) => void;
  onFieldPermChange: (fp: WizardState['fieldPermissions']) => void;
}) {
  const [fieldsOpen, setFieldsOpen] = useState(true);

  const modPerms = modulePermissions[mod.id] ?? {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  };
  const canRead = modPerms.canRead;

  const togglePerm = (key: PermKey) => {
    onModulePermChange({
      ...modulePermissions,
      [mod.id]: { ...modPerms, [key]: !modPerms[key] },
    });
  };

  const toggleField = (fieldId: string) => {
    onFieldPermChange({ ...fieldPermissions, [fieldId]: !(fieldPermissions[fieldId] !== false) });
  };

  const allFieldsAllowed = mod.fields.length > 0 && mod.fields.every((f) => fieldPermissions[f.id] !== false);
  const someFieldsAllowed = mod.fields.some((f) => fieldPermissions[f.id] !== false);

  const toggleAllFields = () => {
    const updates = { ...fieldPermissions };
    mod.fields.forEach((f) => {
      updates[f.id] = !allFieldsAllowed;
    });
    onFieldPermChange(updates);
  };

  const activePermCount = CRUD_PERMS.filter((p) => modPerms[p.key]).length;
  const allowedFieldCount = mod.fields.filter((f) => fieldPermissions[f.id] !== false).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">{mod.name}</span>
              <code className="text-xs text-muted-foreground bg-background border border-border/60 px-1.5 py-0.5 rounded font-mono shrink-0">
                {mod.slug}
              </code>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {activePermCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              <PermissionSummary perms={modPerms} />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">No access configured</span>
          )}
        </div>
      </div>

      {/* CRUD permission toggles */}
      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Operations</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CRUD_PERMS.map(({ key, label, activeClass, icon }) => {
            const active = modPerms[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePerm(key)}
                className={[
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150',
                  active
                    ? `${activeClass} ring-1`
                    : 'bg-background text-muted-foreground border-border hover:border-muted-foreground/40 hover:text-foreground',
                ].join(' ')}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fields section */}
      {mod.fields.length > 0 && (
        <div>
          {/* Fields header */}
          <button
            type="button"
            onClick={() => setFieldsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg
                className={['w-3.5 h-3.5 text-muted-foreground transition-transform duration-150', fieldsOpen ? 'rotate-90' : ''].join(' ')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-xs font-medium text-foreground">Field Access</span>
              <span className="text-xs text-muted-foreground">
                {canRead ? `${allowedFieldCount} / ${mod.fields.length} allowed` : 'requires Read permission'}
              </span>
            </div>
            {canRead && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); toggleAllFields(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); toggleAllFields(); } }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors select-none"
              >
                <span>{allFieldsAllowed ? 'Deny all' : 'Allow all'}</span>
                {/* mini toggle visual */}
                <div className={['relative w-7 h-3.5 rounded-full transition-colors', allFieldsAllowed ? 'bg-emerald-500' : someFieldsAllowed ? 'bg-amber-400' : 'bg-muted-foreground/30'].join(' ')}>
                  <div className={['absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all', allFieldsAllowed ? 'left-3.5' : 'left-0.5'].join(' ')} />
                </div>
              </div>
            )}
          </button>

          {/* Field rows */}
          {fieldsOpen && (
            <div className={['divide-y divide-border/60 border-t border-border/60', !canRead ? 'opacity-50 pointer-events-none' : ''].join(' ')}>
              {!canRead && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
                  <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                  <p className="text-xs text-amber-700">Enable Read permission to configure field access</p>
                </div>
              )}
              {mod.fields.map((field) => {
                const allowed = fieldPermissions[field.id] !== false;
                return (
                  <div
                    key={field.id}
                    className={[
                      'flex items-center justify-between px-4 py-2.5 transition-colors',
                      allowed && canRead ? 'bg-white' : 'bg-muted/20',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <code className="text-xs font-mono text-foreground">{field.name}</code>
                      <span
                        className={[
                          'text-xs px-1.5 py-0.5 rounded border font-medium',
                          FIELD_TYPE_COLORS[field.type] ?? 'text-muted-foreground bg-muted border-border',
                        ].join(' ')}
                      >
                        {field.type.toLowerCase()}
                      </span>
                      {field.required && (
                        <span className="text-xs px-1.5 py-0.5 rounded border font-medium text-blue-700 bg-blue-50 border-blue-100">
                          required
                        </span>
                      )}
                      {field.sensitive && (
                        <span className="text-xs px-1.5 py-0.5 rounded border font-medium text-red-700 bg-red-50 border-red-100 flex items-center gap-1">
                          🔒 sensitive
                        </span>
                      )}
                    </div>

                    {/* Allow / Deny toggle */}
                    <button
                      type="button"
                      onClick={() => toggleField(field.id)}
                      className={[
                        'shrink-0 ml-4 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all duration-150',
                        allowed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-muted text-muted-foreground border-border hover:border-muted-foreground/40',
                      ].join(' ')}
                    >
                      {allowed ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Allow
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Deny
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ModuleAccessConfig({
  modules,
  modulePermissions,
  fieldPermissions,
  onModulePermChange,
  onFieldPermChange,
}: ModuleAccessConfigProps) {
  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">No modules selected. Go back to select modules.</p>
      </div>
    );
  }

  const totalConfigured = modules.filter((m) => {
    const p = modulePermissions[m.id];
    return p && Object.values(p).some(Boolean);
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Configure Access</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set operations and field-level access for each module
          </p>
        </div>
        {totalConfigured > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
            {totalConfigured} / {modules.length} configured
          </span>
        )}
      </div>

      {/* Per-module cards */}
      <div className="space-y-3">
        {modules.map((mod) => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            modulePermissions={modulePermissions}
            fieldPermissions={fieldPermissions}
            onModulePermChange={onModulePermChange}
            onFieldPermChange={onFieldPermChange}
          />
        ))}
      </div>
    </div>
  );
}
