/**
 * Authentication API functions
 */

import { apiClient, setAuthToken, clearAuthToken } from '@/lib/api';
import type { LoginCredentials, RegisterData, Token, User } from '@/types/api';

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<User> {
  return apiClient.post<User>('/auth/register', data);
}

/**
 * Login and get access token
 */
export async function login(credentials: LoginCredentials): Promise<Token> {
  const token = await apiClient.post<Token>('/auth/token', credentials);
  setAuthToken(token.accessToken);
  return token;
}

/**
 * Logout and clear token
 */
export function logout(): void {
  clearAuthToken();
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/users/me');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}
