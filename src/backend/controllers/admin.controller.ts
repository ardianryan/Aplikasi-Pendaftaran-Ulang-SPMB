/**
 * Admin Controller
 * Handles dashboard stats, student management, verification, import/export
 */

import type { Context } from "hono";
import { Student } from "../models/Student";
import { Admin } from "../models/Admin";
import { ReferralCode } from "../models/ReferralCode";
import { Setting, DEFAULT_SETTINGS } from "../models/Setting";
import { uploadToR2, deleteFromR2 } from "../services/r2.service";
import {
  generateImportTemplate,
  importFromExcel,
  exportToExcel,
} from "../services/excel.service";
import { success, error, paginated } from "../utils/response";
import {
  createWhatsAppAdapter,
  renderTemplate,
  normalizePhone,
} from "../services/whatsapp/whatsapp.service";
import { WALog } from "../models/WALog";

// ============================================
// GET /admin/stats
// Dashboard statistics
// ============================================

export async function getStats(c: Context) {
  try {
    const [
      totalStudents,
      submitted,
      verified,
      rejected,
      pending,
      byJalur,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isSubmitted: true }),
      Student.countDocuments({ "verifikasi.status": "verified" }),
      Student.countDocuments({ "verifikasi.status": "rejected" }),
      Student.countDocuments({
        isSubmitted: true,
        "verifikasi.status": "pending",
      }),
      Student.aggregate([
        { $group: { _id: "$jalur", count: { $sum: 1 } } },
      ]),
    ]);

    const notStarted = totalStudents - submitted;

    return success(c, {
      total: totalStudents,
      submitted,
      notStarted,
      verification: {
        verified,
        rejected,
        pending,
      },
      byJalur: byJalur.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (err: any) {
    console.error("[ADMIN] getStats error:", err);
    return error(c, "Gagal mengambil statistik.", 500);
  }
}

// ============================================
// GET /admin/students
// Paginated student list with filters
// ============================================

export async function getStudents(c: Context) {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const jalur = c.req.query("jalur") || "";
    const status = c.req.query("status") || ""; // submitted, not_started, verified, rejected, pending
    const sort = c.req.query("sort") || "-updatedAt";

    // Build filter
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { nisn: { $regex: search, $options: "i" } },
        { namaPreRegister: { $regex: search, $options: "i" } },
        { "biodata.namaLengkap": { $regex: search, $options: "i" } },
      ];
    }

    if (jalur) {
      filter.jalur = jalur;
    }

    if (status === "submitted") {
      filter.isSubmitted = true;
    } else if (status === "not_started") {
      filter.isSubmitted = false;
    } else if (status === "verified") {
      filter["verifikasi.status"] = "verified";
    } else if (status === "rejected") {
      filter["verifikasi.status"] = "rejected";
    } else if (status === "pending") {
      filter.isSubmitted = true;
      filter["verifikasi.status"] = "pending";
    }

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    if (sort.startsWith("-")) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .select(
          "nisn namaPreRegister tanggalLahirPreRegister jalur asalSmpPreRegister wizardStep isSubmitted submittedAt verifikasi.status updatedAt"
        )
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    return paginated(c, students, { page, limit, total });
  } catch (err: any) {
    console.error("[ADMIN] getStudents error:", err);
    return error(c, "Gagal mengambil data siswa.", 500);
  }
}

// ============================================
// POST /admin/students
// Create student manual
// ============================================

export async function addStudent(c: Context) {
  try {
    const body = await c.req.json();
    const { nisn, nama, asalSmp, jalur } = body;

    if (!nisn || nisn.length !== 10) {
      return error(c, "NISN harus 10 digit.", 400);
    }
    if (!nama) {
      return error(c, "Nama wajib diisi.", 400);
    }

    const existing = await Student.findOne({ nisn });
    if (existing) {
      return error(c, `Siswa dengan NISN ${nisn} sudah terdaftar.`, 409);
    }

    const student = await Student.create({
      nisn,
      namaPreRegister: nama,
      asalSmpPreRegister: asalSmp || "",
      jalur: jalur || "Tahap 1",
      wizardStep: 1,
      isSubmitted: false,
    });

    return success(c, student, `Siswa ${nama} berhasil ditambahkan manual.`);
  } catch (err: any) {
    console.error("[ADMIN] addStudent error:", err);
    return error(c, "Gagal menambahkan siswa.", 500);
  }
}

// ============================================
// GET /admin/students/:id
// Full student detail
// ============================================

export async function getStudentDetail(c: Context) {
  const id = c.req.param("id");

  try {
    const student = await Student.findById(id).lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    return success(c, student);
  } catch (err: any) {
    console.error("[ADMIN] getStudentDetail error:", err);
    return error(c, "Gagal mengambil detail siswa.", 500);
  }
}

// ============================================
// DELETE /admin/students/:id
// Delete a student record
// ============================================

/**
 * GET /admin/students/:id/pdf
 * Admin downloads student PDF (buku induk)
 */
export async function adminDownloadPdf(c: Context) {
  const id = c.req.param("id");

  try {
    const student = await Student.findById(id).lean();
    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    const { generatePdf } = await import("../services/pdf.service");
    const pdfBuffer = await generatePdf(student);

    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", `attachment; filename="Buku_Induk_${student.nisn}.pdf"`);
    return c.body(pdfBuffer as any);
  } catch (err: any) {
    console.error("[ADMIN] adminDownloadPdf error:", err);
    return error(c, "Gagal menghasilkan PDF.", 500);
  }
}

/**
 * PUT /admin/students/:id/update
 * Admin/operator can directly edit student biodata
 */
export async function updateStudentData(c: Context) {
  const id = c.req.param("id");

  try {
    const body = await c.req.json();
    const updateObj: Record<string, any> = {};

    // Build dot-notation update from nested body
    const sections = ["biodata", "alamat", "kesehatan", "pendidikan", "ayah", "ibu", "wali", "kegemaran"];
    for (const section of sections) {
      if (body[section] && typeof body[section] === "object") {
        for (const [key, value] of Object.entries(body[section])) {
          if (value !== undefined) {
            updateObj[`${section}.${key}`] = value;
          }
        }
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return success(c, null, "Tidak ada perubahan.");
    }

    await Student.findByIdAndUpdate(id, { $set: updateObj });
    return success(c, null, "Data siswa berhasil diperbarui.");
  } catch (err: any) {
    console.error("[ADMIN] updateStudentData error:", err);
    return error(c, "Gagal memperbarui data siswa.", 500);
  }
}

// ============================================
// DELETE /admin/students/:id
// ============================================

export async function deleteStudent(c: Context) {
  const id = c.req.param("id");

  try {
    const student = await Student.findById(id);

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    // Delete uploaded documents from R2 if any
    const docs = student.dokumen;
    if (docs) {
      const docKeys = [docs.kartuKeluarga, docs.ijazahSkl, docs.aktaKelahiran, docs.foto4x6]
        .filter((d) => d && d.key)
        .map((d) => d!.key);

      for (const key of docKeys) {
        try {
          await deleteFromR2(key);
        } catch {
          // Non-critical: continue even if R2 delete fails
        }
      }
    }

    await Student.findByIdAndDelete(id);

    return success(c, { id }, `Data siswa ${student.namaPreRegister} berhasil dihapus.`);
  } catch (err: any) {
    console.error("[ADMIN] deleteStudent error:", err);
    return error(c, "Gagal menghapus data siswa.", 500);
  }
}

// ============================================
// PUT /admin/students/:id/verify
// Verify or reject a student's registration
// ============================================

export async function verifyStudent(c: Context) {
  const id = c.req.param("id");
  const adminId = c.get("adminId");

  try {
    const body = await c.req.json();
    const { status, catatan, dokumenStatus } = body;

    if (!["verified", "rejected"].includes(status)) {
      return error(c, "Status harus 'verified' atau 'rejected'.", 400);
    }

    const updateData: Record<string, any> = {
      "verifikasi.status": status,
      "verifikasi.verifiedBy": adminId,
      "verifikasi.verifiedAt": new Date(),
      "verifikasi.catatan": catatan || "",
    };

    // Update individual document verification status if provided
    if (dokumenStatus) {
      for (const [docType, docStatus] of Object.entries(dokumenStatus)) {
        if (docStatus && typeof docStatus === "object") {
          updateData[`verifikasi.dokumenStatus.${docType}`] = docStatus;
        }
      }
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .select("nisn namaPreRegister namaLengkap biodata.namaLengkap alamat.telepon jalur verifikasi")
      .lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    // Try sending WhatsApp notification (graceful degradation)
    try {
      const adapter = await createWhatsAppAdapter();
      if (adapter && student.alamat?.telepon) {
        const templateKey = status === "verified" ? "wa_template_verified" : "wa_template_rejected";
        const tplSetting = await Setting.findOne({ key: templateKey }).lean();
        const template = tplSetting?.value;
        
        if (template) {
          const schoolSettings = await Setting.find({
            key: { $in: ["school_name", "school_year", "app_name"] },
          }).lean();
          const settingsMap: Record<string, string> = {};
          for (const s of schoolSettings) settingsMap[s.key] = String(s.value || "");
          const appUrl = process.env.APP_URL || "http://localhost:3000";

          const studentName = student.biodata?.namaLengkap || student.namaPreRegister || (student as any).namaLengkap || "";
          const vars: Record<string, string> = {
            nama: studentName,
            nisn: student.nisn || "",
            jalur: student.jalur || "",
            sekolah: settingsMap.school_name || "",
            tahun: settingsMap.school_year || "",
            url: appUrl,
          };

          const message = renderTemplate(template, vars);
          const waResult = await adapter.sendMessage(student.alamat.telepon, message);

          // Log the message
          const adminUsername = c.get("adminUsername") || "admin";
          await WALog.create({
            recipientPhone: normalizePhone(student.alamat.telepon),
            recipientName: studentName,
            recipientNisn: student.nisn || "",
            messageType: status === "verified" ? "verified" : "rejected",
            messageContent: message,
            status: waResult.success ? "sent" : "failed",
            messageId: waResult.messageId || "",
            errorMessage: waResult.error || "",
            sentBy: adminUsername,
          });
        }
      }
    } catch (waErr: any) {
      console.error("[WA-AUTO-NOTIF] Gagal mengirim notifikasi otomatis:", waErr.message);
    }

    return success(
      c,
      student,
      `Data siswa berhasil ${status === "verified" ? "diverifikasi" : "ditolak"}.`
    );
  } catch (err: any) {
    console.error("[ADMIN] verifyStudent error:", err);
    return error(c, "Gagal memverifikasi data siswa.", 500);
  }
}

// ============================================
// POST /admin/import
// Import students from Excel file
// ============================================

export async function importStudents(c: Context) {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error(c, "File Excel tidak ditemukan.", 400);
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx")) {
      return error(c, "File harus berformat Excel (.xlsx).", 422);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await importFromExcel(buffer);

    return success(c, result, `Import selesai: ${result.inserted} baru, ${result.updated} diperbarui, ${result.failed} gagal.`);
  } catch (err: any) {
    console.error("[ADMIN] importStudents error:", err);
    return error(c, `Gagal mengimport data: ${err.message}`, 500);
  }
}

// ============================================
// GET /admin/import/template
// Download Excel import template
// ============================================

export async function getImportTemplate(c: Context) {
  try {
    const buffer = await generateImportTemplate();

    c.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    c.header(
      "Content-Disposition",
      'attachment; filename="Template_Import_Siswa_SMAN1Gedeg.xlsx"'
    );

    return c.body(buffer as any);
  } catch (err: any) {
    console.error("[ADMIN] getImportTemplate error:", err);
    return error(c, "Gagal menghasilkan template.", 500);
  }
}

// ============================================
// GET /admin/export
// Export all student data to Excel
// ============================================

export async function exportStudents(c: Context) {
  try {
    const jalur = c.req.query("jalur") || "";
    const status = c.req.query("status") || "";

    const filter: Record<string, any> = {};
    if (jalur && jalur !== "all") filter.jalur = jalur;
    if (status === "submitted") {
      filter.isSubmitted = true;
    } else if (status === "verified") {
      filter["verifikasi.status"] = "verified";
    } else if (status === "rejected") {
      filter["verifikasi.status"] = "rejected";
    } else if (status === "pending") {
      filter.isSubmitted = true;
      filter["verifikasi.status"] = "pending";
    }

    const buffer = await exportToExcel(filter);

    c.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    c.header(
      "Content-Disposition",
      `attachment; filename="Export_Registrasi_SMAN1Gedeg_${Date.now()}.xlsx"`
    );

    return c.body(buffer as any);
  } catch (err: any) {
    console.error("[ADMIN] exportStudents error:", err);
    return error(c, "Gagal mengexport data.", 500);
  }
}

// ============================================
// GET /admin/settings
// Get portal settings
// ============================================

export async function getSettings(c: Context) {
  try {
    let settings = await Setting.find().lean();

    // Seed default settings if empty
    if (settings.length === 0) {
      await Setting.insertMany(DEFAULT_SETTINGS);
      settings = await Setting.find().lean();
    } else {
      // Seed any missing keys to ensure compatibility on update
      const existingKeys = settings.map((s: any) => s.key);
      const missingSettings = DEFAULT_SETTINGS.filter(
        (ds) => !existingKeys.includes(ds.key)
      );
      if (missingSettings.length > 0) {
        await Setting.insertMany(missingSettings);
        settings = await Setting.find().lean();
      }
    }

    // Convert to key-value object
    const settingsObj = settings.reduce(
      (acc, s) => {
        acc[s.key] = { value: s.value, description: s.description };
        return acc;
      },
      {} as Record<string, any>
    );

    return success(c, settingsObj);
  } catch (err: any) {
    console.error("[ADMIN] getSettings error:", err);
    return error(c, "Gagal mengambil pengaturan.", 500);
  }
}

// ============================================
// PUT /admin/settings
// Update portal settings
// ============================================

export async function updateSettings(c: Context) {
  try {
    const body = await c.req.json();

    // body should be { key: value, key: value, ... }
    const updates = Object.entries(body);

    if (updates.length === 0) {
      return error(c, "Tidak ada pengaturan yang diperbarui.", 400);
    }

    for (const [key, value] of updates) {
      await Setting.updateOne(
        { key },
        { $set: { value, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    return success(c, null, "Pengaturan berhasil diperbarui.");
  } catch (err: any) {
    console.error("[ADMIN] updateSettings error:", err);
    return error(c, "Gagal memperbarui pengaturan.", 500);
  }
}

// ============================================
// POST /admin/settings/upload/:key
// Upload file for settings (logo, icon)
// ============================================

export async function uploadSettingsFile(c: Context) {
  const key = c.req.param("key") || "";

  // Only allow specific keys for file upload
  const allowedKeys = ["app_logo", "app_icon", "kop_logo_left", "kop_logo_right"];
  if (!allowedKeys.includes(key)) {
    return error(c, `Key '${key}' tidak mendukung upload file. Hanya: ${allowedKeys.join(", ")}`, 400);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error(c, "File tidak ditemukan.", 400);
    }

    // Validate file type (images only for logo/icon)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"];
    if (!allowedTypes.includes(file.type)) {
      return error(c, "Tipe file tidak diizinkan. Gunakan PNG, JPG, SVG, WEBP, atau ICO.", 422);
    }

    // Validate size (max 2MB for logo/icon)
    if (file.size > 2 * 1024 * 1024) {
      return error(c, "Ukuran file melebihi 2MB.", 422);
    }

    // Delete old file if exists
    const existingSetting = await Setting.findOne({ key }).lean();
    if (existingSetting?.value && typeof existingSetting.value === "string" && existingSetting.value.length > 0) {
      try {
        // Extract key from URL if it's a full URL
        const oldKey = existingSetting.value.includes("/")
          ? existingSetting.value.split("/").slice(3).join("/") // Remove domain part
          : existingSetting.value;
        if (oldKey.startsWith("uploads/")) {
          await deleteFromR2(oldKey);
        }
      } catch {
        // Non-critical: old file deletion failed
      }
    }

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicUrl = "";

    if (key === "app_icon") {
      const fs = await import("fs/promises");
      const path = await import("path");
      const faviconPath = path.join(process.cwd(), "public", "favicon.ico");
      await fs.writeFile(faviconPath, buffer);
      publicUrl = `/favicon.ico?v=${Date.now()}`;
    } else {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      const { getR2Client, getR2Bucket, getR2PublicUrl, getR2Prefix } = await import("../config/r2");

      const r2Key = `${getR2Prefix()}settings/${key}.${ext}`;

      const client = getR2Client();
      await client.send(new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: r2Key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=86400",
      }));

      // Build public URL
      const publicBase = getR2PublicUrl();
      publicUrl = publicBase ? `${publicBase.replace(/\/$/, "")}/${r2Key}` : r2Key;
    }

    // Save URL to settings
    await Setting.updateOne(
      { key },
      { $set: { value: publicUrl, updatedAt: new Date() } },
      { upsert: true }
    );

    return success(c, { key, url: publicUrl }, `${key === "app_logo" ? "Logo" : "Icon"} berhasil diperbarui.`);
  } catch (err: any) {
    console.error("[ADMIN] uploadSettingsFile error:", err);
    return error(c, "Gagal mengupload file.", 500);
  }
}

// ============================================
// POST /admin/sso/pull
// Pull guru/tendik from ScholarGate SSO → create operator accounts
// ============================================

export async function pullSSOMembers(c: Context) {
  const { fetchAllSSOMembers } = await import("../services/sso.service");

  try {
    // Fetch guru and tendik only (not siswa)
    const [guruMembers, tendikMembers] = await Promise.all([
      fetchAllSSOMembers("guru"),
      fetchAllSSOMembers("tendik"),
    ]);
    const members = [...guruMembers, ...tendikMembers];

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const member of members) {
      // Skip members without google_email (can't login via Google)
      if (!member.google_email) {
        skipped++;
        continue;
      }

      // Upsert: create or update operator based on ssoId
      const existing = await Admin.findOne({
        $or: [
          { ssoId: member.id },
          { googleEmail: member.google_email },
        ],
      });

      if (existing) {
        // Update existing
        existing.nama = member.nama || existing.nama;
        existing.googleEmail = member.google_email;
        existing.googleAvatar = member.google_avatar || existing.googleAvatar;
        existing.nip = member.nip || existing.nip;
        existing.ssoId = member.id;
        existing.authMethod = "google";
        await existing.save();
        updated++;
      } else {
        // Create new operator
        const username = member.google_email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        await Admin.create({
          username: username || `sso_${member.id}`,
          passwordHash: "", // No password, Google-only
          nama: member.nama,
          role: "operator",
          isActive: true,
          ssoId: member.id,
          googleEmail: member.google_email,
          googleAvatar: member.google_avatar || null,
          nip: member.nip || null,
          authMethod: "google",
        });
        inserted++;
      }
    }

    return success(c, {
      total: members.length,
      inserted,
      updated,
      skipped,
    }, `Berhasil tarik data SSO: ${inserted} baru, ${updated} diperbarui, ${skipped} dilewati (tanpa Google email).`);
  } catch (err: any) {
    console.error("[ADMIN] pullSSOMembers error:", err);
    return error(c, `Gagal tarik data SSO: ${err.message}`, 500);
  }
}

// ============================================
// GET /admin/operators
// List all admin/operator accounts
// ============================================

/**
 * POST /admin/operators
 * Create a local operator (username + password, no Google)
 */
export async function createOperator(c: Context) {
  try {
    const body = await c.req.json();
    const { username, password, nama, role } = body;

    if (!username || username.length < 3) {
      return error(c, "Username minimal 3 karakter.", 400);
    }
    if (!password || password.length < 6) {
      return error(c, "Password minimal 6 karakter.", 400);
    }
    if (!nama) {
      return error(c, "Nama wajib diisi.", 400);
    }

    // Check duplicate username
    const existing = await Admin.findOne({ username: username.toLowerCase() });
    if (existing) {
      return error(c, `Username "${username}" sudah digunakan.`, 409);
    }

    const newOperator = await Admin.create({
      username: username.toLowerCase().trim(),
      passwordHash: password, // Will be hashed by pre-save hook
      nama: nama.trim(),
      role: role === "admin" ? "admin" : "operator",
      isActive: true,
      authMethod: "local",
      googleEmail: null,
      googleAvatar: null,
      ssoId: null,
      nip: null,
    });

    return success(c, {
      id: newOperator._id,
      username: newOperator.username,
      nama: newOperator.nama,
      role: newOperator.role,
      authMethod: "local",
    }, `Operator "${nama}" berhasil dibuat.`);
  } catch (err: any) {
    console.error("[ADMIN] createOperator error:", err);
    return error(c, "Gagal membuat operator.", 500);
  }
}

export async function getOperators(c: Context) {
  try {
    const operators = await Admin.find()
      .select("username nama role isActive googleEmail googleAvatar nip authMethod ssoId lastLogin createdAt")
      .sort({ role: 1, nama: 1 })
      .lean();

    return success(c, operators);
  } catch (err: any) {
    console.error("[ADMIN] getOperators error:", err);
    return error(c, "Gagal mengambil data operator.", 500);
  }
}

// ============================================
// PUT /admin/operators/:id
// Update operator role or active status
// ============================================

export async function updateOperator(c: Context) {
  const id = c.req.param("id");

  try {
    const body = await c.req.json();
    const { role, isActive } = body;

    const updateData: Record<string, any> = {};
    if (role && ["admin", "operator"].includes(role)) {
      updateData.role = role;
    }
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return error(c, "Tidak ada data yang diperbarui.", 400);
    }

    const operator = await Admin.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .select("username nama role isActive googleEmail authMethod")
      .lean();

    if (!operator) {
      return error(c, "Operator tidak ditemukan.", 404);
    }

    return success(c, operator, "Operator berhasil diperbarui.");
  } catch (err: any) {
    console.error("[ADMIN] updateOperator error:", err);
    return error(c, "Gagal memperbarui operator.", 500);
  }
}

// ============================================
// DELETE /admin/operators/:id
// Remove an operator account
// ============================================

export async function deleteOperator(c: Context) {
  const id = c.req.param("id");
  const currentAdminId = c.get("adminId");

  // Prevent self-deletion
  if (id === currentAdminId) {
    return error(c, "Tidak dapat menghapus akun sendiri.", 400);
  }

  try {
    const operator = await Admin.findByIdAndDelete(id);

    if (!operator) {
      return error(c, "Operator tidak ditemukan.", 404);
    }

    return success(c, { id }, `Operator ${operator.nama} berhasil dihapus.`);
  } catch (err: any) {
    console.error("[ADMIN] deleteOperator error:", err);
    return error(c, "Gagal menghapus operator.", 500);
  }
}

// ============================================
// Referral Code Management
// ============================================

/**
 * GET /admin/referrals
 * List all referral codes
 */
export async function getReferrals(c: Context) {
  try {
    const referrals = await ReferralCode.find()
      .sort({ createdAt: -1 })
      .lean();

    return success(c, referrals);
  } catch (err: any) {
    console.error("[ADMIN] getReferrals error:", err);
    return error(c, "Gagal mengambil data referral.", 500);
  }
}

/**
 * POST /admin/referrals
 * Create a new referral code prefix
 */
export async function createReferral(c: Context) {
  const adminId = c.get("adminId");

  try {
    const body = await c.req.json();
    const { prefix, label, maxSlots } = body;

    if (!prefix || prefix.length < 3) {
      return error(c, "Prefix minimal 3 karakter.", 400);
    }

    // Check if prefix already exists
    const existing = await ReferralCode.findOne({ prefix: prefix.toUpperCase() });
    if (existing) {
      return error(c, `Prefix "${prefix.toUpperCase()}" sudah digunakan.`, 409);
    }

    const referral = await ReferralCode.create({
      prefix: prefix.toUpperCase(),
      label: label || "",
      maxSlots: Math.min(Math.max(maxSlots || 99, 1), 99),
      createdBy: adminId,
    });

    return success(c, referral, `Referral "${referral.prefix}" berhasil dibuat. Slot: 1-${referral.maxSlots}`);
  } catch (err: any) {
    console.error("[ADMIN] createReferral error:", err);
    return error(c, "Gagal membuat referral code.", 500);
  }
}

/**
 * DELETE /admin/referrals/:id
 * Delete a referral code
 */
export async function deleteReferral(c: Context) {
  const id = c.req.param("id");

  try {
    const referral = await ReferralCode.findByIdAndDelete(id);
    if (!referral) {
      return error(c, "Referral code tidak ditemukan.", 404);
    }

    return success(c, { id }, `Referral "${referral.prefix}" berhasil dihapus.`);
  } catch (err: any) {
    console.error("[ADMIN] deleteReferral error:", err);
    return error(c, "Gagal menghapus referral code.", 500);
  }
}

/**
 * PUT /admin/referrals/:id/toggle
 * Toggle active/inactive status
 */
export async function toggleReferral(c: Context) {
  const id = c.req.param("id");

  try {
    const referral = await ReferralCode.findById(id);
    if (!referral) {
      return error(c, "Referral code tidak ditemukan.", 404);
    }

    referral.isActive = !referral.isActive;
    await referral.save();

    return success(c, { isActive: referral.isActive }, `Referral "${referral.prefix}" ${referral.isActive ? "diaktifkan" : "dinonaktifkan"}.`);
  } catch (err: any) {
    console.error("[ADMIN] toggleReferral error:", err);
    return error(c, "Gagal mengubah status referral.", 500);
  }
}

// ============================================
// Profile Management
// ============================================

/**
 * GET /admin/profile
 * Get current admin/operator profile
 */
export async function getProfile(c: Context) {
  const adminId = c.get("adminId");

  try {
    const admin = await Admin.findById(adminId)
      .select("username nama role isActive googleEmail googleAvatar nip authMethod lastLogin createdAt")
      .lean();

    if (!admin) {
      return error(c, "Akun tidak ditemukan.", 404);
    }

    return success(c, admin);
  } catch (err: any) {
    console.error("[ADMIN] getProfile error:", err);
    return error(c, "Gagal mengambil data profil.", 500);
  }
}

/**
 * PUT /admin/profile
 * Update current admin/operator profile (name and password)
 */
export async function updateProfile(c: Context) {
  const adminId = c.get("adminId");

  try {
    const body = await c.req.json();
    const { nama, oldPassword, newPassword } = body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return error(c, "Akun tidak ditemukan.", 404);
    }

    // Update Name (if provided)
    if (nama && nama.trim().length > 0) {
      admin.nama = nama.trim();
    }

    // Update Password (only for local auth users)
    if (newPassword) {
      if (admin.authMethod !== "local") {
        return error(c, "Akun Google tidak dapat mengubah password di sini.", 400);
      }

      if (!oldPassword) {
        return error(c, "Password lama wajib diisi untuk mengganti password.", 400);
      }

      const isMatch = await admin.comparePassword(oldPassword);
      if (!isMatch) {
        return error(c, "Password lama salah.", 401);
      }

      if (newPassword.length < 6) {
        return error(c, "Password baru minimal 6 karakter.", 400);
      }

      admin.passwordHash = newPassword; // Will be hashed by pre-save hook
    }

    await admin.save();

    return success(c, {
      id: admin._id,
      username: admin.username,
      nama: admin.nama,
      role: admin.role,
    }, "Profil berhasil diperbarui.");
  } catch (err: any) {
    console.error("[ADMIN] updateProfile error:", err);
    return error(c, "Gagal memperbarui profil.", 500);
  }
}
