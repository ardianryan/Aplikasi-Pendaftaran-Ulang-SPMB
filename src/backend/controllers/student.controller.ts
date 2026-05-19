/**
 * Student Controller
 * Handles all wizard step operations for student registration
 */

import type { Context } from "hono";
import { Student } from "../models/Student";
import {
  biodataUpdateSchema,
  biodataCompleteSchema,
} from "../validators/biodata.schema";
import { success, error, validationError } from "../utils/response";
import { WIZARD_STEPS } from "../config/constants";
import { generatePdf } from "../services/pdf.service";

// ============================================
// GET /student/profile
// Returns pre-register data + current wizard state
// ============================================

export async function getProfile(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const student = await Student.findOne({ nisn })
      .select(
        "nisn namaPreRegister tanggalLahirPreRegister asalSmpPreRegister jalur noDiterima wizardStep isSubmitted submittedAt"
      )
      .lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    return success(c, {
      nisn: student.nisn,
      nama: student.namaPreRegister,
      tanggalLahir: student.tanggalLahirPreRegister,
      asalSmp: student.asalSmpPreRegister,
      jalur: student.jalur,
      noDiterima: student.noDiterima,
      wizardStep: student.wizardStep,
      isSubmitted: student.isSubmitted,
      submittedAt: student.submittedAt,
    });
  } catch (err: any) {
    console.error("[STUDENT] getProfile error:", err);
    return error(c, "Gagal mengambil data profil.", 500);
  }
}

// ============================================
// POST /student/confirm
// Confirms identity data → advances to Step 2
// ============================================

export async function confirmData(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const student = await Student.findOne({ nisn });

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    // Only allow confirmation from Step 1
    if (student.wizardStep > WIZARD_STEPS.CONFIRM) {
      return success(c, { wizardStep: student.wizardStep }, "Data sudah dikonfirmasi sebelumnya.");
    }

    // Pre-fill biodata with pre-register data
    student.biodata.namaLengkap = student.namaPreRegister;
    student.biodata.tanggalLahir = student.tanggalLahirPreRegister;
    student.pendidikan.asalSekolah = student.asalSmpPreRegister;

    // Advance to Step 2
    student.wizardStep = WIZARD_STEPS.BIODATA;
    await student.save();

    return success(
      c,
      { wizardStep: WIZARD_STEPS.BIODATA },
      "Data berhasil dikonfirmasi. Silakan lanjutkan mengisi biodata."
    );
  } catch (err: any) {
    console.error("[STUDENT] confirmData error:", err);
    return error(c, "Gagal mengkonfirmasi data.", 500);
  }
}

// ============================================
// GET /student/biodata
// Returns saved biodata (all sections)
// ============================================

export async function getBiodata(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const student = await Student.findOne({ nisn })
      .select("biodata alamat kesehatan pendidikan ayah ibu wali kegemaran wizardStep")
      .lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    return success(c, {
      biodata: student.biodata,
      alamat: student.alamat,
      kesehatan: student.kesehatan,
      pendidikan: student.pendidikan,
      ayah: student.ayah,
      ibu: student.ibu,
      wali: student.wali,
      kegemaran: student.kegemaran,
      wizardStep: student.wizardStep,
    });
  } catch (err: any) {
    console.error("[STUDENT] getBiodata error:", err);
    return error(c, "Gagal mengambil data biodata.", 500);
  }
}

// ============================================
// PUT /student/biodata
// Auto-save biodata (partial - any section)
// ============================================

export async function updateBiodata(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const body = await c.req.json();
    const validation = biodataUpdateSchema.safeParse(body);

    if (!validation.success) {
      return validationError(
        c,
        validation.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }))
      );
    }

    const data = validation.data;

    // Fields that are pre-filled from import and cannot be changed by student
    const LOCKED_BIODATA_FIELDS = ["namaLengkap", "tanggalLahir"];
    const LOCKED_PENDIDIKAN_FIELDS = ["asalSekolah"];

    // Build update object dynamically (only update provided sections)
    const updateObj: Record<string, any> = {};

    if (data.biodata) {
      Object.entries(data.biodata).forEach(([key, value]) => {
        // Skip locked fields - these come from pre-register data
        if (LOCKED_BIODATA_FIELDS.includes(key)) return;
        if (value !== undefined) updateObj[`biodata.${key}`] = value;
      });
    }
    if (data.pendidikan) {
      Object.entries(data.pendidikan).forEach(([key, value]) => {
        // Skip locked fields
        if (LOCKED_PENDIDIKAN_FIELDS.includes(key)) return;
        if (value !== undefined) updateObj[`pendidikan.${key}`] = value;
      });
    }
    if (data.alamat) {
      Object.entries(data.alamat).forEach(([key, value]) => {
        if (value !== undefined) updateObj[`alamat.${key}`] = value;
      });
    }
    if (data.kesehatan) {
      Object.entries(data.kesehatan).forEach(([key, value]) => {
        if (value !== undefined) updateObj[`kesehatan.${key}`] = value;
      });
    }
    if (data.pendidikan) {
      Object.entries(data.pendidikan).forEach(([key, value]) => {
        if (value !== undefined) updateObj[`pendidikan.${key}`] = value;
      });
    }
    if (data.ayah) {
      Object.entries(data.ayah).forEach(([key, value]) => {
        if (value !== undefined) updateObj[`ayah.${key}`] = value;
      });
    }
    if (data.ibu) {
      Object.entries(data.ibu).forEach(([key, value]) => {
        if (value !== undefined) updateObj[`ibu.${key}`] = value;
      });
    }
    if (data.wali) {
      Object.entries(data.wali).forEach(([key, value]) => {
        if (value !== undefined) updateObj[`wali.${key}`] = value;
      });
    }
    if (data.kegemaran) {
      Object.entries(data.kegemaran).forEach(([key, value]) => {
        if (value !== undefined) updateObj[`kegemaran.${key}`] = value;
      });
    }

    if (Object.keys(updateObj).length === 0) {
      return success(c, null, "Tidak ada data yang diperbarui.");
    }

    await Student.updateOne({ nisn }, { $set: updateObj });

    return success(c, null, "Data berhasil disimpan.");
  } catch (err: any) {
    console.error("[STUDENT] updateBiodata error:", err);
    return error(c, "Gagal menyimpan data biodata.", 500);
  }
}

// ============================================
// POST /student/biodata/complete
// Validates all required fields → advances to Step 3
// ============================================

export async function completeBiodata(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const student = await Student.findOne({ nisn })
      .select("biodata alamat kesehatan pendidikan ayah ibu wali kegemaran wizardStep")
      .lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    // Validate completeness of all required fields
    const validationData = {
      biodata: student.biodata,
      alamat: student.alamat,
      kesehatan: student.kesehatan,
      pendidikan: student.pendidikan,
      ayah: student.ayah,
      ibu: student.ibu,
      wali: student.wali,
      kegemaran: student.kegemaran,
    };

    const validation = biodataCompleteSchema.safeParse(validationData);

    if (!validation.success) {
      return validationError(
        c,
        validation.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }))
      );
    }

    // Advance to Step 3 (Upload) or Step 4 (Review) depending on upload setting
    const { Setting } = await import("../models/Setting");
    const uploadEnabledSetting = await Setting.findOne({ key: "upload_document_enabled" }).lean();
    const isUploadEnabled = uploadEnabledSetting?.value !== false && uploadEnabledSetting?.value !== "false";

    const nextStep = isUploadEnabled ? WIZARD_STEPS.UPLOAD : WIZARD_STEPS.REVIEW;

    await Student.updateOne(
      { nisn },
      { $set: { wizardStep: nextStep } }
    );

    return success(
      c,
      { wizardStep: nextStep },
      isUploadEnabled
        ? "Biodata lengkap. Silakan lanjutkan upload dokumen."
        : "Biodata lengkap. Silakan lakukan review akhir."
    );
  } catch (err: any) {
    console.error("[STUDENT] completeBiodata error:", err);
    return error(c, "Gagal memvalidasi kelengkapan biodata.", 500);
  }
}

// ============================================
// GET /student/review
// Returns all data for final review (Step 4)
// ============================================

export async function getReview(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const student = await Student.findOne({ nisn })
      .select("-__v")
      .lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    return success(c, student);
  } catch (err: any) {
    console.error("[STUDENT] getReview error:", err);
    return error(c, "Gagal mengambil data review.", 500);
  }
}

// ============================================
// POST /student/submit
// Final submission - locks the form permanently
// ============================================

export async function submitFinal(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const student = await Student.findOne({ nisn });

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    // Verify all required documents are uploaded based on settings & jalur
    const { Setting } = await import("../models/Setting");
    const uploadEnabledSetting = await Setting.findOne({ key: "upload_document_enabled" }).lean();
    const isUploadEnabled = uploadEnabledSetting?.value !== false && uploadEnabledSetting?.value !== "false";

    if (isUploadEnabled) {
      const berkasSetting = await Setting.findOne({ key: "landing_berkas_json" }).lean();
      const berkasConfig = berkasSetting?.value || [];
      const studentJalur = student.jalur || "all";

      const requiredDocs = berkasConfig.filter((b: any) => 
        b.active && 
        b.required && 
        (b.jalur.includes("all") || b.jalur.includes(studentJalur))
      );

      const docs = student.dokumen || {};
      const missingDocs = requiredDocs.filter((rd: any) => !docs[rd.id] || !(docs[rd.id] as any).key);

      if (missingDocs.length > 0) {
        const missingLabels = missingDocs.map((md: any) => md.title).join(", ");
        return error(
          c,
          `Dokumen wajib belum lengkap: ${missingLabels}`,
          422
        );
      }
    }

    // Verify biodata is complete (wizard step >= 3)
    if (student.wizardStep < WIZARD_STEPS.UPLOAD) {
      return error(c, "Biodata belum lengkap.", 422);
    }

    // Lock the form
    student.isSubmitted = true;
    student.submittedAt = new Date();
    student.wizardStep = WIZARD_STEPS.DONE;
    await student.save();

    return success(
      c,
      {
        isSubmitted: true,
        submittedAt: student.submittedAt,
        wizardStep: WIZARD_STEPS.DONE,
      },
      "Registrasi ulang berhasil dikirim! Data Anda telah dikunci."
    );
  } catch (err: any) {
    console.error("[STUDENT] submitFinal error:", err);
    return error(c, "Gagal mengirim data final.", 500);
  }
}

// ============================================
// GET /student/pdf
// Generate and download PDF bukti registrasi
// ============================================

export async function downloadPdf(c: Context) {
  const nisn = c.get("studentNisn");

  try {
    const student = await Student.findOne({ nisn }).lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    if (!student.isSubmitted) {
      return error(c, "PDF hanya tersedia setelah pengiriman final.", 403);
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(student);

    // Return PDF as download
    c.header("Content-Type", "application/pdf");
    c.header(
      "Content-Disposition",
      `attachment; filename="Buku_Induk_${student.nisn}.pdf"`
    );

    return c.body(pdfBuffer as any);
  } catch (err: any) {
    console.error("[STUDENT] downloadPdf error:", err);
    return error(c, "Gagal menghasilkan PDF.", 500);
  }
}
