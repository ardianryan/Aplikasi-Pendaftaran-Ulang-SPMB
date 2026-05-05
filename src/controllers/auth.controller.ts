/**
 * Auth Controller
 * Handles student and admin authentication
 */

import type { Context } from "hono";
import { Student } from "../models/Student";
import { Admin } from "../models/Admin";
import { ReferralCode } from "../models/ReferralCode";
import { Setting } from "../models/Setting";
import { signStudentToken, signAdminToken } from "../services/jwt.service";
import { verifyGoogleToken } from "../services/sso.service";
import { studentLoginSchema, adminLoginSchema } from "../validators/auth.schema";
import { success, error, validationError } from "../utils/response";

// ============================================
// Student Login
// ============================================

/**
 * POST /api/auth/login
 * Authenticates student using NISN + Tanggal Lahir
 * Returns JWT token + basic student info
 */
export async function loginStudent(c: Context) {
  // Check if registration is open
  const regSetting = await Setting.findOne({ key: "registration_open" }).lean();
  if (regSetting && regSetting.value === false) {
    const msgSetting = await Setting.findOne({ key: "registration_closed_message" }).lean();
    const closedMessage = msgSetting?.value || "Registrasi ulang telah ditutup.";
    return error(c, closedMessage, 403);
  }

  // Validate request body
  const body = await c.req.json();
  const validation = studentLoginSchema.safeParse(body);

  if (!validation.success) {
    return validationError(
      c,
      validation.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    );
  }

  const { nisn, tanggalLahir } = validation.data;

  try {
    // Find student by NISN
    const student = await Student.findOne({ nisn }).lean();

    if (!student) {
      return error(
        c,
        "NISN tidak ditemukan. Pastikan Anda sudah terdaftar sebagai siswa yang diterima.",
        404
      );
    }

    // Verify tanggal lahir matches (timezone-safe comparison)
    // Use UTC date parts to avoid timezone offset issues
    const stored = new Date(student.tanggalLahirPreRegister);
    const storedYear = stored.getFullYear();
    const storedMonth = String(stored.getMonth() + 1).padStart(2, "0");
    const storedDay = String(stored.getDate()).padStart(2, "0");
    const storedDate = `${storedYear}-${storedMonth}-${storedDay}`;

    const inputDate = tanggalLahir; // Already in YYYY-MM-DD format

    if (storedDate !== inputDate) {
      // Also try UTC comparison in case stored date was saved in UTC
      const storedUTC = `${stored.getUTCFullYear()}-${String(stored.getUTCMonth() + 1).padStart(2, "0")}-${String(stored.getUTCDate()).padStart(2, "0")}`;
      
      if (storedUTC !== inputDate) {
        return error(
          c,
          "Tanggal lahir tidak cocok dengan data yang terdaftar.",
          401
        );
      }
    }

    // Generate JWT token
    const token = signStudentToken(nisn);

    // Return token + student summary
    return success(c, {
      token,
      student: {
        nisn: student.nisn,
        nama: student.namaPreRegister,
        jalur: student.jalur,
        asalSmp: student.asalSmpPreRegister,
        wizardStep: student.wizardStep,
        isSubmitted: student.isSubmitted,
      },
    }, "Login berhasil");
  } catch (err: any) {
    console.error("[AUTH] Student login error:", err);
    return error(c, "Terjadi kesalahan saat login.", 500);
  }
}

// ============================================
// Admin Login
// ============================================

/**
 * POST /api/auth/admin/login
 * Authenticates admin using username + password
 * Returns JWT token + admin info
 */
export async function loginAdmin(c: Context) {
  // Validate request body
  const body = await c.req.json();
  const validation = adminLoginSchema.safeParse(body);

  if (!validation.success) {
    return validationError(
      c,
      validation.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    );
  }

  const { username, password } = validation.data;

  try {
    // Find admin by username (case-insensitive due to schema lowercase)
    const admin = await Admin.findOne({ username: username.toLowerCase() });

    if (!admin) {
      return error(c, "Username atau password salah.", 401);
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return error(c, "Username atau password salah.", 401);
    }

    // Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = signAdminToken(
      admin._id.toString(),
      admin.username,
      admin.role
    );

    return success(c, {
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        nama: admin.nama,
        role: admin.role,
      },
    }, "Login admin berhasil");
  } catch (err: any) {
    console.error("[AUTH] Admin login error:", err);
    return error(c, "Terjadi kesalahan saat login admin.", 500);
  }
}

// ============================================
// Google OAuth Login (for operators/admin)
// ============================================

/**
 * Helper: verify Google access token and get user info
 */
async function verifyGoogleAccessToken(credential: string, email?: string): Promise<{
  email: string;
  name: string;
  picture: string;
} | null> {
  if (email) {
    // Token client flow: verify via userinfo endpoint
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${credential}` },
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    return { email: data.email, name: data.name || "", picture: data.picture || "" };
  } else {
    // ID token flow
    return verifyGoogleToken(credential);
  }
}

/**
 * POST /api/auth/google
 * Flow:
 * 1. Verify Google token → get email
 * 2. Check if email exists in ScholarGate SSO (guru/tendik only)
 * 3. If local account exists & active → login
 * 4. If local account doesn't exist → return "needs_referral" status
 */
export async function loginGoogle(c: Context) {
  const { lookupSSOMember } = await import("../services/sso.service");

  try {
    const body = await c.req.json();
    const { credential, email, name, picture } = body;

    if (!credential) {
      return error(c, "Google credential tidak ditemukan.", 400);
    }

    // Step 1: Verify Google token
    const googleUser = await verifyGoogleAccessToken(credential, email);
    if (!googleUser || !googleUser.email) {
      return error(c, "Token Google tidak valid atau sudah kedaluwarsa.", 401);
    }

    const googleEmail = googleUser.email;
    const googleName = googleUser.name || name || "";
    const googlePicture = googleUser.picture || picture || "";

    // Step 2: Check ScholarGate SSO — WAJIB guru/tendik untuk user baru
    let ssoMember: any = null;
    let ssoError = false;
    try {
      console.log(`[AUTH] SSO lookup for: ${googleEmail}`);
      const ssoResult = await lookupSSOMember(googleEmail);
      console.log(`[AUTH] SSO result: found=${ssoResult.found}, role=${ssoResult.data?.role}`);
      if (ssoResult.found && ssoResult.data) {
        const role = ssoResult.data.role?.toLowerCase();
        if (role === "guru" || role === "tendik") {
          ssoMember = ssoResult.data;
        }
      }
    } catch (ssoErr: any) {
      // SSO service down — don't block users who already have local account
      console.error("[AUTH] SSO lookup failed:", ssoErr.message || ssoErr);
      ssoError = true;
    }

    // Step 3: Check local account
    const existingAdmin = await Admin.findOne({ googleEmail, authMethod: "google" });

    if (existingAdmin) {
      // Account exists locally — allow login (SSO already verified at registration time)
      if (!existingAdmin.isActive) {
        return error(c, "Akun Anda telah dinonaktifkan. Hubungi admin.", 403);
      }

      // Login success
      existingAdmin.lastLogin = new Date();
      existingAdmin.googleAvatar = googlePicture || existingAdmin.googleAvatar;
      await existingAdmin.save();

      const token = signAdminToken(
        existingAdmin._id.toString(),
        existingAdmin.username,
        existingAdmin.role
      );

      return success(c, {
        status: "authenticated",
        token,
        admin: {
          id: existingAdmin._id,
          username: existingAdmin.username,
          nama: existingAdmin.nama,
          role: existingAdmin.role,
          googleEmail: existingAdmin.googleEmail,
          googleAvatar: existingAdmin.googleAvatar,
        },
      }, "Login berhasil");
    }

    // Step 4: No local account — user is NEW
    // SSO check is MANDATORY for new users
    if (!ssoMember) {
      if (ssoError) {
        return error(
          c,
          "Tidak dapat memverifikasi akun Anda karena layanan SSO sedang tidak tersedia. Coba lagi nanti.",
          500
        );
      }
      return error(
        c,
        `Akun ${googleEmail} tidak terdaftar sebagai guru/tendik di sistem SSO sekolah. Hanya guru dan tendik yang dapat menjadi operator.`,
        403
      );
    }

    // SSO verified as guru/tendik — needs referral code to activate
    return c.json({
      success: true,
      data: {
        status: "needs_referral",
        googleEmail,
        googleName,
        googlePicture,
        ssoName: ssoMember.nama || googleName,
        ssoRole: ssoMember.role || null,
        ssoNip: ssoMember.nip || null,
      },
      message: "Akun Anda terverifikasi sebagai guru/tendik. Masukkan kode referral dari admin untuk mengaktifkan akses.",
    }, 200);
  } catch (err: any) {
    console.error("[AUTH] Google login error:", err);
    return error(c, "Terjadi kesalahan saat login dengan Google.", 500);
  }
}

/**
 * POST /api/auth/activate-operator
 * Activates a new operator account using referral code
 * Called after loginGoogle returns "needs_referral"
 * Body: { referralCode, credential, email, name, picture }
 */
export async function activateOperator(c: Context) {
  try {
    const body = await c.req.json();
    const { referralCode, credential, email, name, picture } = body;

    if (!referralCode || !credential || !email) {
      return error(c, "Kode referral dan login Google diperlukan.", 400);
    }

    // Verify Google token again (security)
    const googleUser = await verifyGoogleAccessToken(credential, email);
    if (!googleUser || !googleUser.email) {
      return error(c, "Token Google tidak valid.", 401);
    }

    const googleEmail = googleUser.email;
    const googleName = googleUser.name || name || "";
    const googlePicture = googleUser.picture || picture || "";

    // Parse referral code: "PREFIX-SUFFIX"
    const lastDash = referralCode.lastIndexOf("-");
    if (lastDash === -1) {
      return error(c, "Format kode referral tidak valid. Gunakan format: PREFIX-NOMOR", 400);
    }

    const prefix = referralCode.substring(0, lastDash).toUpperCase();
    const suffix = parseInt(referralCode.substring(lastDash + 1), 10);

    if (isNaN(suffix) || suffix < 1 || suffix > 99) {
      return error(c, "Nomor referral harus antara 1-99.", 400);
    }

    // Validate referral code
    const referral = await ReferralCode.findOne({ prefix, isActive: true });
    if (!referral) {
      return error(c, "Kode referral tidak valid atau sudah tidak aktif.", 404);
    }

    if (suffix > referral.maxSlots) {
      return error(c, `Nomor referral melebihi batas (maks: ${referral.maxSlots}).`, 400);
    }

    const slotUsed = referral.usedSlots.find((s) => s.suffix === suffix);
    if (slotUsed) {
      return error(c, `Kode referral ${referralCode} sudah digunakan.`, 409);
    }

    // Check if email already registered
    const existing = await Admin.findOne({ googleEmail });
    if (existing) {
      return error(c, `Email ${googleEmail} sudah terdaftar.`, 409);
    }

    // Create operator account
    const username = googleEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const newOperator = await Admin.create({
      username: username || `op_${Date.now()}`,
      passwordHash: "",
      nama: googleName,
      role: "operator",
      isActive: true,
      ssoId: null,
      googleEmail,
      googleAvatar: googlePicture,
      nip: null,
      authMethod: "google",
    });

    // Mark slot as used
    referral.usedSlots.push({
      suffix,
      usedBy: newOperator._id,
      usedAt: new Date(),
      googleEmail,
    } as any);
    await referral.save();

    // Auto-login
    const token = signAdminToken(
      newOperator._id.toString(),
      newOperator.username,
      newOperator.role
    );

    return success(c, {
      status: "authenticated",
      token,
      admin: {
        id: newOperator._id,
        username: newOperator.username,
        nama: newOperator.nama,
        role: newOperator.role,
        googleEmail: newOperator.googleEmail,
        googleAvatar: newOperator.googleAvatar,
      },
    }, "Akun berhasil diaktifkan! Selamat datang.");
  } catch (err: any) {
    console.error("[AUTH] activateOperator error:", err);
    return error(c, "Terjadi kesalahan saat aktivasi.", 500);
  }
}

// ============================================
// Operator Self-Registration (Referral Code + Google)
// ============================================

// registerOperator removed — replaced by activateOperator above
