/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to context
 */

import type { Context, Next } from "hono";
import {
  verifyToken,
  extractToken,
  type StudentTokenPayload,
  type AdminTokenPayload,
} from "../services/jwt.service";
import { error } from "../utils/response";

// ============================================
// Extend Hono context with user data
// ============================================

// We store auth data in c.set() / c.get() using these keys
declare module "hono" {
  interface ContextVariableMap {
    studentNisn: string;
    adminId: string;
    adminUsername: string;
    adminRole: "admin" | "operator";
  }
}

// ============================================
// Student Auth Middleware
// ============================================

/**
 * Middleware: Requires a valid student JWT token
 * Sets `studentNisn` in context for downstream handlers
 */
export async function studentAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const cookie = c.req.header("Cookie");

  const token = extractToken(authHeader, cookie);

  if (!token) {
    return error(c, "Akses ditolak. Token tidak ditemukan.", 401);
  }

  try {
    const payload = verifyToken(token);

    // Ensure this is a student token
    if (payload.type !== "student") {
      return error(c, "Akses ditolak. Token bukan untuk siswa.", 403);
    }

    const studentPayload = payload as StudentTokenPayload;
    c.set("studentNisn", studentPayload.nisn);

    await next();
  } catch (err: any) {
    return error(c, err.message || "Token tidak valid.", 401);
  }
}

// ============================================
// Admin Auth Middleware
// ============================================

/**
 * Middleware: Requires a valid admin JWT token
 * Sets `adminId`, `adminUsername`, `adminRole` in context
 */
export async function adminAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const cookie = c.req.header("Cookie");

  const token = extractToken(authHeader, cookie);

  if (!token) {
    return error(c, "Akses ditolak. Token admin tidak ditemukan.", 401);
  }

  try {
    const payload = verifyToken(token);

    // Ensure this is an admin token
    if (payload.type !== "admin") {
      return error(c, "Akses ditolak. Token bukan untuk admin.", 403);
    }

    const adminPayload = payload as AdminTokenPayload;
    c.set("adminId", adminPayload.id);
    c.set("adminUsername", adminPayload.username);
    c.set("adminRole", adminPayload.role);

    await next();
  } catch (err: any) {
    return error(c, err.message || "Token admin tidak valid.", 401);
  }
}

/**
 * Middleware: Requires the admin role to be "admin" (Super Admin)
 */
export async function requireAdmin(c: Context, next: Next) {
  const role = c.get("adminRole");
  if (role !== "admin") {
    return error(c, "Akses ditolak. Tindakan ini memerlukan hak akses Super Admin.", 403);
  }
  await next();
}

/**
 * Middleware: Requires a specific operator permission key to be true
 * Super Admins (role === "admin") bypass this check.
 */
export function requirePermission(key: string) {
  return async function (c: Context, next: Next) {
    const role = c.get("adminRole");
    if (role === "admin") {
      await next();
      return;
    }

    try {
      const { getSettingsMap } = await import("../utils/settings");
      const settings = await getSettingsMap();
      const isAllowed = settings[key] === true;
      if (!isAllowed) {
        return error(
          c,
          `Akses ditolak. Operator tidak memiliki hak akses untuk tindakan ini.`,
          403
        );
      }
      await next();
    } catch (err) {
      return error(c, "Gagal memverifikasi hak akses operator.", 500);
    }
  };
}
