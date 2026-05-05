/**
 * Locked Middleware
 * Prevents modifications to student data after final submission
 * If isSubmitted=true, all write operations are blocked
 */

import type { Context, Next } from "hono";
import { Student } from "../models/Student";
import { error } from "../utils/response";

/**
 * Middleware: Block write operations if student has already submitted
 * Must be used AFTER studentAuth middleware (requires studentNisn in context)
 */
export async function lockedGuard(c: Context, next: Next) {
  const nisn = c.get("studentNisn");

  if (!nisn) {
    return error(c, "NISN tidak ditemukan dalam sesi.", 401);
  }

  try {
    const student = await Student.findOne({ nisn }).select("isSubmitted").lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    if (student.isSubmitted) {
      return error(
        c,
        "Data Anda sudah dikunci setelah pengiriman final. Tidak dapat melakukan perubahan.",
        403
      );
    }

    await next();
  } catch (err: any) {
    return error(c, "Gagal memeriksa status pengiriman.", 500);
  }
}
