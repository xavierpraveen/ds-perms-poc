'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import type { Module, CreateModuleDto, UpdateModuleDto, CreateModuleFieldDto, UpdateModuleFieldDto, Environment } from '@dmds/types';

export function useModules(environment?: Environment) {
  const { fetchWithAuth } = useApiClient();
  const params = environment ? `?environment=${environment}` : '';
  return useQuery<Module[]>({
    queryKey: ['modules', environment],
    queryFn: () => fetchWithAuth(`/modules${params}`),
  });
}

export function useModule(id: string) {
  const { fetchWithAuth } = useApiClient();
  return useQuery<Module>({
    queryKey: ['modules', id],
    queryFn: () => fetchWithAuth(`/modules/${id}`),
    enabled: !!id,
  });
}

export function useCreateModule() {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<Module, Error, CreateModuleDto>({
    mutationFn: (dto) => fetchWithAuth('/modules', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules'] }),
  });
}

export function useUpdateModule(id: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<Module, Error, UpdateModuleDto>({
    mutationFn: (dto) =>
      fetchWithAuth(`/modules/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules'] }),
  });
}

export function useDeleteModule(id: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => fetchWithAuth(`/modules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules'] }),
  });
}

export function useAddField(moduleId: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<unknown, Error, CreateModuleFieldDto>({
    mutationFn: (dto) =>
      fetchWithAuth(`/modules/${moduleId}/fields`, { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules', moduleId] }),
  });
}

export function useUpdateField(moduleId: string, fieldId: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<unknown, Error, UpdateModuleFieldDto>({
    mutationFn: (dto) =>
      fetchWithAuth(`/modules/${moduleId}/fields/${fieldId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules', moduleId] }),
  });
}

export function useDeleteField(moduleId: string, fieldId: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () =>
      fetchWithAuth(`/modules/${moduleId}/fields/${fieldId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules', moduleId] }),
  });
}

export function useReorderFields(moduleId: string) {
  const { fetchWithAuth } = useApiClient();
  const qc = useQueryClient();
  return useMutation<unknown, Error, string[]>({
    mutationFn: (fieldIds) =>
      fetchWithAuth(`/modules/${moduleId}/fields/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ fieldIds }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules', moduleId] }),
  });
}
