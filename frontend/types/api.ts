/**
 * Common API response types
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API error response
 */
export interface ApiError {
  detail: string;
  status: number;
}

/**
 * User types matching backend schema
 */
export interface User {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface UserUpdate {
  email?: string;
  name?: string;
  password?: string;
  isActive?: boolean;
}

export interface UserListResponse extends PaginatedResponse<User> {}

/**
 * Authentication types
 */
export interface Token {
  accessToken: string;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}
