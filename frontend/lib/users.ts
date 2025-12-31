/**
 * User API functions
 */

import { apiClient } from '@/lib/api';
import type { User, UserListResponse, UserUpdate } from '@/types/api';

/**
 * Get user by ID
 */
export async function getUser(id: number): Promise<User> {
  return apiClient.get<User>(`/users/${id}`);
}

/**
 * Get list of users (admin only)
 */
export async function getUsers(
  page: number = 1,
  pageSize: number = 20
): Promise<UserListResponse> {
  return apiClient.get<UserListResponse>(
    `/users?page=${page}&page_size=${pageSize}`
  );
}

/**
 * Update current user profile
 */
export async function updateCurrentUser(data: UserUpdate): Promise<User> {
  return apiClient.patch<User>('/users/me', data);
}

/**
 * Update user by ID (admin only)
 */
export async function updateUser(id: number, data: UserUpdate): Promise<User> {
  return apiClient.patch<User>(`/users/${id}`, data);
}

/**
 * Delete user by ID (admin only)
 */
export async function deleteUser(id: number): Promise<void> {
  return apiClient.delete<void>(`/users/${id}`);
}
