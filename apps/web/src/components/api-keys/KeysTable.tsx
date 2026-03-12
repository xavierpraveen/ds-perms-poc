'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, FlaskConical, Copy } from 'lucide-react';
import type { ApiKey } from '@dmds/types';
import SparklineCell from './SparklineCell';
import { useUpdateApiKey, useDeleteApiKey } from '@/hooks/useApiKeys';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Row-level sub-components
// ---------------------------------------------------------------------------

function StatusCell({ record }: { record: ApiKey }) {
  const mutation = useUpdateApiKey(record.id);
  return (
    <Switch
      checked={record.active}
      disabled={mutation.isPending}
      onCheckedChange={(checked) => mutation.mutate({ active: checked })}
      aria-label={record.active ? 'Active' : 'Inactive'}
    />
  );
}

function ActionCell({ record }: { record: ApiKey }) {
  const router = useRouter();
  const deleteMutation = useDeleteApiKey(record.id);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => router.push(`/dashboard/keys/${record.id}/test`)}
              aria-label="Test this key"
            >
              <FlaskConical className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Test this key</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => router.push(`/dashboard/keys/${record.id}/edit`)}
              aria-label="Edit permissions"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit permissions</TooltipContent>
        </Tooltip>

        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  aria-label="Revoke key"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Revoke key</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the key and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteMutation.mutate()}
              >
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Main table
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

export default function KeysTable({ keys }: { keys: ApiKey[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(keys.length / PAGE_SIZE);
  const pageKeys = keys.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium w-[110px]">Environment</th>
              <th className="px-4 py-3 text-left font-medium">Modules</th>
              <th className="px-4 py-3 text-left font-medium w-[140px]">7-day usage</th>
              <th className="px-4 py-3 text-left font-medium w-[100px]">Last used</th>
              <th className="px-4 py-3 text-left font-medium w-[80px]">Status</th>
              <th className="px-4 py-3 text-left font-medium w-[100px]">Created</th>
              <th className="px-4 py-3 text-left font-medium w-[110px]"></th>
            </tr>
          </thead>
          <tbody>
            {pageKeys.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No API keys found.
                </td>
              </tr>
            ) : (
              pageKeys.map((record) => (
                <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  {/* Name + prefix */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{record.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {record.keyPrefix}...
                      </span>
                    </div>
                  </td>

                  {/* Environment */}
                  <td className="px-4 py-3">
                    <Badge
                      variant={record.environment === 'PRODUCTION' ? 'destructive' : 'secondary'}
                    >
                      {record.environment === 'PRODUCTION' ? 'Production' : 'Sandbox'}
                    </Badge>
                  </td>

                  {/* Modules */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.moduleTags?.slice(0, 3).map((tag) => {
                        const perms = [
                          tag.canRead && 'R',
                          tag.canCreate && 'C',
                          tag.canUpdate && 'U',
                          tag.canDelete && 'D',
                        ]
                          .filter(Boolean)
                          .join('');
                        return (
                          <Badge key={tag.moduleSlug} variant="outline" className="text-[11px]">
                            {tag.moduleName}: {perms || 'none'}
                          </Badge>
                        );
                      })}
                      {(record.moduleTags?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-[11px]">
                          +{(record.moduleTags?.length || 0) - 3} more
                        </Badge>
                      )}
                      {!record.moduleTags?.length && (
                        <span className="text-xs text-muted-foreground">No modules</span>
                      )}
                    </div>
                  </td>

                  {/* Sparkline */}
                  <td className="px-4 py-3">
                    <SparklineCell apiKeyId={record.id} />
                  </td>

                  {/* Last used */}
                  <td className="px-4 py-3">
                    {record.lastUsedAt ? (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs cursor-default">
                              {formatRelative(record.lastUsedAt)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(record.lastUsedAt).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-xs text-muted-foreground">Never</span>
                    )}
                  </td>

                  {/* Status toggle */}
                  <td className="px-4 py-3">
                    <StatusCell record={record} />
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <ActionCell record={record} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {keys.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{keys.length} {keys.length === 1 ? 'key' : 'keys'}</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
