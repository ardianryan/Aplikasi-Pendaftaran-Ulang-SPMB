/**
 * Standardized API Response Helpers
 * Ensures consistent response format across all endpoints
 */

import type { Context } from "hono";

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Success response (200)
 */
export function success<T>(c: Context, data?: T, message?: string) {
  const response: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  };
  return c.json(response, 200);
}

/**
 * Created response (201)
 */
export function created<T>(c: Context, data?: T, message?: string) {
  const response: ApiResponse<T> = {
    success: true,
    message: message || "Data berhasil dibuat",
    ...(data !== undefined && { data }),
  };
  return c.json(response, 201);
}

/**
 * Paginated response (200)
 */
export function paginated<T>(
  c: Context,
  data: T[],
  meta: { page: number; limit: number; total: number }
) {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  };
  return c.json(response, 200);
}

/**
 * Error response (4xx/5xx)
 */
export function error(
  c: Context,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500 = 400
) {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return c.json(response, status);
}

/**
 * Validation error response (422)
 */
export function validationError(c: Context, errors: unknown[]) {
  const response: ApiResponse = {
    success: false,
    message: "Validasi gagal",
    errors,
  };
  return c.json(response, 422);
}
