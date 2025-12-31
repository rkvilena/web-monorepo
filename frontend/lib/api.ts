/**
 * API client for making HTTP requests to the backend
 */

import { ApiError } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Get stored auth token
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Set auth token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('access_token');
}

/**
 * Build request headers
 */
function buildHeaders(customHeaders?: HeadersInit): Headers {
  const headers = new Headers(customHeaders);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = 'An error occurred';

    try {
      const errorData = (await response.json()) as ApiError;
      detail = errorData.detail || detail;
    } catch {
      detail = response.statusText || detail;
    }

    throw new ApiClientError(response.status, detail);
  }

  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * API client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(options?.headers),
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(options?.headers),
      ...options,
    });
    return handleResponse<T>(response);
  },
};
