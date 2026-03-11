'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import type { RequestLog, PaginatedResponse, LogFilter } from '@dmds/types';

export function useLogs(filter: LogFilter) {
  const { fetchWithAuth } = useApiClient();
  const params = new URLSearchParams();
  if (filter.apiKeyId) params.set('apiKeyId', filter.apiKeyId);
  if (filter.method) params.set('method', filter.method);
  if (filter.statusCode) params.set('statusCode', String(filter.statusCode));
  if (filter.startDate) params.set('startDate', filter.startDate);
  if (filter.endDate) params.set('endDate', filter.endDate);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.limit) params.set('limit', String(filter.limit));

  return useQuery<PaginatedResponse<RequestLog>>({
    queryKey: ['logs', filter],
    queryFn: () => fetchWithAuth(`/logs?${params.toString()}`),
  });
}

export function useLog(id: string) {
  const { fetchWithAuth } = useApiClient();
  return useQuery<RequestLog>({
    queryKey: ['logs', id],
    queryFn: () => fetchWithAuth(`/logs/${id}`),
    enabled: !!id,
  });
}
