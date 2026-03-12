'use client';

import { useRouter } from 'next/navigation';
import { Plus, Key } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import KeysTable from '@/components/api-keys/KeysTable';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function KeysDashboard() {
  const router = useRouter();
  const { data: keys, isLoading, error } = useApiKeys();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Key className="h-6 w-6 text-blue-500" />
            API Credentials
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage API keys and their module access permissions
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/keys/new')} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Key
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Failed to load API keys</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : !keys?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Key className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-base font-medium">No API keys yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first key to start accessing your dynamic modules
          </p>
          <Button onClick={() => router.push('/dashboard/keys/new')} className="mt-2">
            Create your first key
          </Button>
        </div>
      ) : (
        <KeysTable keys={keys} />
      )}
    </div>
  );
}
