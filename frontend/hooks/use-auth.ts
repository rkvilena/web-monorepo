'use client';

/**
 * Hook for authentication with TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginCredentials, RegisterData, User } from '@/types/api';
import { getCurrentUser, login, logout, register } from '@/lib/auth';

const USER_QUERY_KEY = ['currentUser'];

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logout();
    },
    onSuccess: () => {
      queryClient.setQueryData<User | null>(USER_QUERY_KEY, null);
      queryClient.clear();
    },
  });
}

/**
 * Hook for registration mutation
 */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
  });
}
