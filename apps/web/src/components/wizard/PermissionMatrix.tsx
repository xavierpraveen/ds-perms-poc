'use client';

import type { Module, WizardState } from '@dmds/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface PermissionMatrixProps {
  modules: Module[];
  permissions: WizardState['modulePermissions'];
  onChange: (perms: WizardState['modulePermissions']) => void;
}

const PERMISSIONS = [
  { key: 'canRead', label: 'Read', activeClass: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'canCreate', label: 'Create', activeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'canUpdate', label: 'Update', activeClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  { key: 'canDelete', label: 'Delete', activeClass: 'bg-red-100 text-red-800 border-red-200' },
] as const;

export default function PermissionMatrix({ modules, permissions, onChange }: PermissionMatrixProps) {
  const handleChange = (
    moduleId: string,
    permKey: keyof WizardState['modulePermissions'][string],
    checked: boolean,
  ) => {
    onChange({
      ...permissions,
      [moduleId]: {
        canRead: permissions[moduleId]?.canRead ?? false,
        canCreate: permissions[moduleId]?.canCreate ?? false,
        canUpdate: permissions[moduleId]?.canUpdate ?? false,
        canDelete: permissions[moduleId]?.canDelete ?? false,
        [permKey]: checked,
      },
    });
  };

  const handleSelectAll = (moduleId: string, checked: boolean) => {
    onChange({
      ...permissions,
      [moduleId]: {
        canRead: checked,
        canCreate: checked,
        canUpdate: checked,
        canDelete: checked,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Configure Permissions</p>
        <p className="text-sm text-muted-foreground mb-4">
          Set Read, Create, Update, and Delete permissions for each selected module.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={modules.map((m) => m.id)} className="space-y-2">
        {modules.map((mod) => {
          const modPerms = permissions[mod.id] || {
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          };
          const allSelected = Object.values(modPerms).every(Boolean);
          const someSelected = Object.values(modPerms).some(Boolean);

          return (
            <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg">
              {/* Flex row: checkbox (sibling, not child of trigger) + trigger for the rest */}
              <div className="flex items-center px-3">
                <div
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="flex items-center pr-3"
                >
                  <Checkbox
                    checked={allSelected}
                    data-indeterminate={!allSelected && someSelected ? 'true' : undefined}
                    onCheckedChange={(checked) => handleSelectAll(mod.id, !!checked)}
                    className={!allSelected && someSelected ? 'opacity-60' : ''}
                  />
                </div>
                <AccordionTrigger className="flex-1 hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{mod.name}</span>
                    <Badge variant="outline" className="text-xs font-normal">{mod.slug}</Badge>
                    <Badge variant="outline" className="text-xs font-normal">{mod.fields.length} fields</Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <AccordionContent>
                <div className="flex items-center gap-6 pl-8 pb-2 pt-1">
                  {PERMISSIONS.map(({ key, label, activeClass }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={modPerms[key]}
                        onCheckedChange={(checked) => handleChange(mod.id, key, !!checked)}
                      />
                      <span
                        className={[
                          'text-xs px-2 py-0.5 rounded-full border font-medium transition-colors',
                          modPerms[key] ? activeClass : 'text-muted-foreground border-border bg-muted',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
