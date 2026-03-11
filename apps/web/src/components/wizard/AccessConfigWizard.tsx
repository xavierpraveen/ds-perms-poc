'use client';

import { useState } from 'react';
import { Steps, Card, Button, Space, Typography, Segmented, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { WizardState, CreateApiKeyDto, Environment } from '@dmds/types';
import ModuleSelector from './ModuleSelector';
import PermissionMatrix from './PermissionMatrix';
import FieldPermissions from './FieldPermissions';
import { useModules } from '@/hooks/useModules';
import { useCreateApiKey } from '@/hooks/useApiKeys';
import KeyRevealModal from '../modals/KeyRevealModal';

const { Title, Text } = Typography;

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
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0 }}>Create API Key</Title>
          <Text type="secondary">Configure a new API key with module-level and field-level permissions</Text>
        </div>

        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Key Name</Text>
              <input
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="e.g. Mobile App Key, CI/CD Pipeline"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Environment</Text>
              <Segmented
                value={environment}
                onChange={(val) => setEnvironment(val as Environment)}
                options={[{ label: '🟢 Production', value: 'PRODUCTION' }, { label: '🔵 Sandbox', value: 'SANDBOX' }]}
              />
            </div>
          </Space>
        </Card>

        <Steps current={currentStep} items={STEPS.map((title) => ({ title }))} style={{ marginBottom: 24 }} />

        <Card style={{ minHeight: 400 }}>
          {modulesLoading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><Spin /></div>
          ) : (
            <>
              {currentStep === 0 && (
                <ModuleSelector modules={modules} selectedIds={wizardState.selectedModuleIds}
                  onChange={(ids) => setWizardState((s) => ({ ...s, selectedModuleIds: ids }))} />
              )}
              {currentStep === 1 && (
                <PermissionMatrix modules={selectedModules} permissions={wizardState.modulePermissions}
                  onChange={(perms) => setWizardState((s) => ({ ...s, modulePermissions: perms }))} />
              )}
              {currentStep === 2 && (
                <FieldPermissions modules={selectedModules} modulePermissions={wizardState.modulePermissions}
                  fieldPermissions={wizardState.fieldPermissions}
                  onChange={(fp) => setWizardState((s) => ({ ...s, fieldPermissions: fp }))} />
              )}
            </>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <Button onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
          <Space>
            {currentStep > 0 && <Button onClick={() => setCurrentStep((s) => s - 1)} disabled={isSubmitting}>Previous</Button>}
            {currentStep < STEPS.length - 1 ? (
              <Button type="primary" onClick={() => setCurrentStep((s) => s + 1)}
                disabled={currentStep === 0 && wizardState.selectedModuleIds.length === 0}>
                Next
              </Button>
            ) : (
              <Button type="primary" onClick={handleCreateAndSave} loading={isSubmitting} disabled={!keyName.trim()}>
                Create Key
              </Button>
            )}
          </Space>
        </div>
      </div>

      {createdKey && (
        <KeyRevealModal open={!!createdKey} apiKey={createdKey} keyName={createdKeyName}
          onClose={() => { setCreatedKey(null); router.push('/dashboard/keys'); }} />
      )}
    </>
  );
}
