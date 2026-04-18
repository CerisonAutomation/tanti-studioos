'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Data fetching hooks using TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-server'

// Generic fetch wrapper
async function fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
      ...options?.headers,
    },
  })
  
  if (!response.ok) throw new Error(`API Error: ${response.status}`)
  return response.json()
}

// CRUD hooks factory
export function useCrudHooks<T>(table: string, queryKey?: string) {
  const queryClient = useQueryClient()
  const key = queryKey || table

  // List query
  const useList = (options?: { enabled?: boolean }) => 
    useQuery({
      queryKey: [key],
      queryFn: () => fetchWithAuth<T[]>(`/api/${table}`),
      enabled: options?.enabled ?? true,
    })

  // Single item query
  const useItem = (id: string, enabled = true) =>
    useQuery({
      queryKey: [key, id],
      queryFn: () => fetchWithAuth<T>(`/api/${table}/${id}`),
      enabled: !!id && enabled,
    })

  // Create mutation
  const useCreate = () =>
    useMutation({
      mutationFn: (data: Partial<T>) =>
        fetch(`/api/${table}`, {
          method: 'POST',
          body: JSON.stringify(data),
        }).then((r) => r.json()),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    })

  // Update mutation
  const useUpdate = () =>
    useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        fetch(`/api/${table}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }).then((r) => r.json()),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    })

  // Delete mutation
  const useDelete = () =>
    useMutation({
      mutationFn: (id: string) =>
        fetch(`/api/${table}/${id}`, { method: 'DELETE' }).then((r) => r.json()),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    })

  return { useList, useItem, useCreate, useUpdate, useDelete }
}

// Optimistic update helper
export function useOptimisticUpdate<T>(queryKey: string[], updateFn: (old: T[]) => T[]) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      if (!old) return old
      return updateFn(old)
    })
  }
}

// Prefetch helper for SSR
export async function prefetchData<T>(queryKey: string[], endpoint: string) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => fetchWithAuth<T>(endpoint),
  })
  return queryClient
}