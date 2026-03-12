'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { WizardState, CreateApiKeyDto, Environment } from '@dmds/types';
import ModuleSelector from './ModuleSelector';
import PermissionMatrix from './PermissionMatrix';
import FieldPermissions from './FieldPermissions';
import { useModules } from '@/hooks/useModules';
import { useCreateApiKey } from '@/hooks/useApiKeys';
import KeyRevealModal from '../modals/KeyRevealModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STEPS = ['Select Modules', 'Set Permissions', 'Field Access'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AccessConfigWizard() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState<Environment>('PRODUCTION' as Environment);
  const [wizardState, setWizardState] = useState<WizardState>({
    selectedModuleIds: [],
    modulePermissions: {},
    fieldPermissions: {},
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdKeyName, setCreatedKeyName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: modules = [], isLoading: modulesLoading } = useModules();
  const createApiKey = useCreateApiKey();
  const selectedModules = modules.filter((m) => wizardState.selectedModuleIds.includes(m.id));

  const handleCreateAndSave = async () => {
    if (!keyName.trim()) return;
    setIsSubmitting(true);
    try {
      const keyDto: CreateApiKeyDto = { name: keyName, environment };
      const response = await createApiKey.mutateAsync(keyDto);
      const token = await getToken();

      const modulePermissions = wizardState.selectedModuleIds.map((moduleId) => ({
        moduleId,
        canRead: wizardState.modulePermissions[moduleId]?.canRead ?? false,
        canCreate: wizardState.modulePermissions[moduleId]?.canCreate ?? false,
        canUpdate: wizardState.modulePermissions[moduleId]?.canUpdate ?? false,
        canDelete: wizardState.modulePermissions[moduleId]?.canDelete ?? false,
      }));

      const fieldPermissions = Object.entries(wizardState.fieldPermissions)
        .filter(([, allowed]) => allowed)
        .map(([moduleFieldId]) => ({ moduleFieldId, allowed: true }));

      if (modulePermissions.length > 0) {
        await fetch(`${API_URL}/api-keys/${response.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ modulePermissions, fieldPermissions }),
        });
      }

      setCreatedKey(response.key);
      setCreatedKeyName(keyName);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Create API Key</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure a new API key with module-level and field-level permissions
          </p>
        </div>

        {/* Key name + environment card */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Key Name</label>
              <input
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Mobile App Key, CI/CD Pipeline"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Environment</label>
              <div className="inline-flex rounded-md border border-input bg-muted p-1 gap-1">
                {(['PRODUCTION', 'SANDBOX'] as Environment[]).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={[
                      'px-4 py-1.5 text-sm rounded-sm font-medium transition-colors',
                      environment === env
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    {env === 'PRODUCTION' ? '🟢 Production' : '🔵 Sandbox'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step indicator */}
        <div className="flex items-center mb-6">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    idx < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : idx === currentStep
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {idx < currentStep ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={[
                    'text-sm font-medium',
                    idx === currentStep ? 'text-foreground' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={['flex-1 h-px mx-3', idx < currentStep ? 'bg-primary' : 'bg-border'].join(' ')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card className="min-h-[400px]">
          <CardContent className="pt-6">
            {modulesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {currentStep === 0 && (
                  <ModuleSelector
                    modules={modules}
                    selectedIds={wizardState.selectedModuleIds}
                    onChange={(ids) => setWizardState((s) => ({ ...s, selectedModuleIds: ids }))}
                  />
                )}
                {currentStep === 1 && (
                  <PermissionMatrix
                    modules={selectedModules}
                    permissions={wizardState.modulePermissions}
                    onChange={(perms) => setWizardState((s) => ({ ...s, modulePermissions: perms }))}
                  />
                )}
                {currentStep === 2 && (
                  <FieldPermissions
                    modules={selectedModules}
                    modulePermissions={wizardState.modulePermissions}
                    fieldPermissions={wizardState.fieldPermissions}
                    onChange={(fp) => setWizardState((s) => ({ ...s, fieldPermissions: fp }))}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)} disabled={isSubmitting}>
                Previous
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={currentStep === 0 && wizardState.selectedModuleIds.length === 0}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleCreateAndSave} disabled={isSubmitting || !keyName.trim()}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Key'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {createdKey && (
        <KeyRevealModal
          open={!!createdKey}
          apiKey={createdKey}
          keyName={createdKeyName}
          onClose={() => {
            setCreatedKey(null);
            router.push('/dashboard/keys');
          }}
        />
      )}
    </>
  );
}
