'use client';

import type { Module, WizardState } from '@dmds/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface FieldPermissionsProps {
  modules: Module[];
  modulePermissions: WizardState['modulePermissions'];
  fieldPermissions: WizardState['fieldPermissions'];
  onChange: (fp: WizardState['fieldPermissions']) => void;
}

export default function FieldPermissions({
  modules,
  modulePermissions,
  fieldPermissions,
  onChange,
}: FieldPermissionsProps) {
  const handleToggle = (fieldId: string, allowed: boolean) => {
    onChange({ ...fieldPermissions, [fieldId]: allowed });
  };

  const handleToggleAll = (fields: Module['fields'], allowed: boolean) => {
    const updates: WizardState['fieldPermissions'] = { ...fieldPermissions };
    fields.forEach((f) => {
      updates[f.id] = allowed;
    });
    onChange(updates);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Field-Level Access</p>
        <p className="text-sm text-muted-foreground mb-4">
          Control which fields are visible per module. Sensitive fields are highlighted. New fields are
          allowed by default.
        </p>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No modules selected</p>
      ) : (
        <Accordion type="multiple" defaultValue={modules.map((m) => m.id)} className="space-y-2">
          {modules.map((mod) => {
            const modPerm = modulePermissions[mod.id];
            const canRead = modPerm?.canRead ?? false;

            const allAllowed = mod.fields.every((f) => fieldPermissions[f.id] !== false);

            return (
              <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-1">
                <AccordionTrigger className="px-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{mod.name}</span>
                    {!canRead && (
                      <Badge variant="outline" className="text-xs font-normal text-amber-700 border-amber-300 bg-amber-50">
                        No read access — field permissions inactive
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 px-3 pb-2">
                    {!canRead && (
                      <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-3">
                        <AlertDescription className="text-xs">
                          Field-level access has no effect without Read permission on this module.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Allow all toggle */}
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Allow all</span>
                      <Switch
                        checked={allAllowed}
                        disabled={!canRead}
                        onCheckedChange={(checked) => handleToggleAll(mod.fields, checked)}
                      />
                    </div>

                    {/* Field rows */}
                    {mod.fields.map((field) => {
                      const allowed = fieldPermissions[field.id] !== false; // default is allowed
                      const active = allowed && canRead;
                      return (
                        <div
                          key={field.id}
                          className={[
                            'flex items-center justify-between px-3 py-2 rounded-md border transition-colors',
                            active
                              ? 'bg-green-50 border-green-200'
                              : 'bg-muted/30 border-border',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm">{field.name}</span>
                            <Badge variant="outline" className="text-xs font-normal">{field.type}</Badge>
                            {field.required && (
                              <Badge variant="outline" className="text-xs font-normal text-blue-700 border-blue-300 bg-blue-50">
                                required
                              </Badge>
                            )}
                            {field.sensitive && (
                              <Badge variant="outline" className="text-xs font-normal text-red-700 border-red-300 bg-red-50">
                                🔒 sensitive
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <span className="text-xs text-muted-foreground">
                              {allowed ? 'Allow' : 'Deny'}
                            </span>
                            <Switch
                              checked={allowed}
                              disabled={!canRead}
                              onCheckedChange={(checked) => handleToggle(field.id, checked)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
