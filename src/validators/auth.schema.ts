/**
 * Auth Validation Schemas (Zod)
 * Validates login request bodies
 */

import { z } from "zod";

/**
 * Student login: NISN (10 digits) + Tanggal Lahir (ISO date string)
 */
export const studentLoginSchema = z.object({
  nisn: z
    .string()
    .length(10, "NISN harus tepat 10 digit")
    .regex(/^\d{10}$/, "NISN hanya boleh berisi angka"),
  tanggalLahir: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format tanggal lahir harus YYYY-MM-DD"
    ),
});

/**
 * Admin login: username + password
 */
export const adminLoginSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .trim(),
  password: z
    .string()
    .min(1, "Password tidak boleh kosong"),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
