'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import type {
  ApiKey,
  CreateApiKeyResponse,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  AssignPermissionsDto,
  PermissionSet,
  SparklineDataPoint,
} from '@dmds/types';

export function useApiKeys() {
  const { fetchWithAuth } = useApiClient();
  return useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: () => fetchWithAuth('/api-keys'),
  });
}

export function useApiKey(id: string) {
  const { fetchWithAuth } = useApiClient();
  return useQuery<ApiKey>({
    queryKey: ['api-keys', id],
    queryFn: () => fetchWithAuth(`/api-keys/${id}`),
    enabled: !!id,
  });
}

export function useApiKeyPermissions(id: string) {
  const { fetchWithAuth } = useApiClient();
  return useQuery<PermissionSet>({
    queryKey: ['api-keys', id, 'permissions'],
    queryFn: () => fetchWithAuth(`/api-keys/${id}/permissions`),
    enabled: !!id,
  });
}

export function useApiKeySparkline(id: string) {
  const { fetchWithAuth } = useApiClient();
  return useQuery<SparklineDataPoint[]>({
    queryKey: ['api-keys', id, 'sparkline'],
    queryFn: () => fetchWithAuth(`/api-keys/${id}/sparkline`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateApiKey() {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<CreateApiKeyResponse, Error, CreateApiKeyDto>({
    mutationFn: (dto) =>
      fetchWithAuth('/api-keys', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useUpdateApiKey(id: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<ApiKey, Error, UpdateApiKeyDto>({
    mutationFn: (dto) =>
      fetchWithAuth(`/api-keys/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useDeleteApiKey(id: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => fetchWithAuth(`/api-keys/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useAssignPermissions(id: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<PermissionSet, Error, AssignPermissionsDto>({
    mutationFn: (dto) =>
      fetchWithAuth(`/api-keys/${id}/permissions`, { method: 'PUT', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys', id] }),
  });
}
