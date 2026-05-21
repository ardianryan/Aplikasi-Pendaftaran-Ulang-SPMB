/**
 * JWT Service
 * Handles token signing, verification, and payload extraction
 */

import jwt from "jsonwebtoken";

// ============================================
// Types
// ============================================

export interface StudentTokenPayload {
  nisn: string;
  type: "student";
}

export interface AdminTokenPayload {
  id: string;
  username: string;
  role: "admin" | "operator";
  type: "admin";
}

export type TokenPayload = StudentTokenPayload | AdminTokenPayload;

// ============================================
// Helper Functions
// ============================================

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || "8h";
}

// ============================================
// Public API
// ============================================

/**
 * Sign a JWT token for a student
 */
export function signStudentToken(nisn: string): string {
  const payload: StudentTokenPayload = { nisn, type: "student" };
  return jwt.sign(payload as object, getSecret(), { expiresIn: getExpiresIn() as any });
}

/**
 * Sign a JWT token for an admin
 */
export function signAdminToken(
  id: string,
  username: string,
  role: "admin" | "operator"
): string {
  const payload: AdminTokenPayload = { id, username, role, type: "admin" };
  return jwt.sign(payload as object, getSecret(), { expiresIn: getExpiresIn() as any });
}

/**
 * Verify and decode a JWT token
 * Returns the payload if valid, throws if invalid/expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getSecret()) as TokenPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token telah kedaluwarsa. Silakan login kembali.");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Token tidak valid.");
    }
    throw new Error("Gagal memverifikasi token.");
  }
}

/**
 * Extract token from Authorization header or cookie
 */
export function extractToken(authHeader?: string, cookie?: string): string | null {
  // Try Authorization header first: "Bearer <token>"
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Try cookie: "token=<value>"
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}
