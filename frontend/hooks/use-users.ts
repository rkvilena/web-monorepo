'use client';

/**
 * Hook for user data with TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, UserListResponse, UserUpdate } from '@/types/api';
import {
  deleteUser,
  getUser,
  getUsers,
  updateCurrentUser,
  updateUser,
} from '@/lib/users';

const USERS_QUERY_KEY = ['users'];
const USER_QUERY_KEY = (id: number) => ['user', id];

/**
 * Hook to get a single user by ID
 */
export function useUser(id: number) {
  return useQuery({
    queryKey: USER_QUERY_KEY(id),
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

/**
 * Hook to get paginated users list
 */
export function useUsers(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, { page, pageSize }],
    queryFn: () => getUsers(page, pageSize),
  });
}

/**
 * Hook to update current user profile
 */
export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdate) => updateCurrentUser(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User>(['currentUser'], updatedUser);
    },
  });
}

/**
 * Hook to update a user by ID (admin)
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      updateUser(id, data),
    onSuccess: (updatedUser, { id }) => {
      queryClient.setQueryData<User>(USER_QUERY_KEY(id), updatedUser);
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook to delete a user by ID (admin)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: USER_QUERY_KEY(id) });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
