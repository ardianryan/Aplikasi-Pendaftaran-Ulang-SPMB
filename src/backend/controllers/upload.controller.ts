/**
 * Upload Controller
 * Handles file upload to R2 and document management
 */

import type { Context } from "hono";
import { Student } from "../models/Student";
import { uploadToR2, deleteFromR2 } from "../services/r2.service";
import { DOCUMENT_TYPES, UPLOAD_CONFIG, type DocumentType } from "../config/constants";
import { success, error } from "../utils/response";

// ============================================
// POST /upload/:docType
// Upload a single document to R2
// ============================================

export async function uploadDocument(c: Context) {
  const nisn = c.get("studentNisn");
  const docType = c.req.param("docType") as string;

  // Validate document type
  if (!/^[a-zA-Z0-9_]+$/.test(docType || "")) {
    return error(c, "Tipe dokumen tidak valid.", 400);
  }

  try {
    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error(c, "File tidak ditemukan dalam request.", 400);
    }

    // Validate file size — check per-berkas max_size_mb setting first
    let effectiveMaxSize = UPLOAD_CONFIG.maxFileSize;
    try {
      const { Setting } = await import("../models/Setting");
      const berkasSetting = await Setting.findOne({ key: "landing_berkas_json" }).lean();
      if (berkasSetting?.value && Array.isArray(berkasSetting.value)) {
        const berkas = (berkasSetting.value as any[]).find((b: any) => b.id === docType);
        if (berkas?.max_size_mb && typeof berkas.max_size_mb === "number") {
          effectiveMaxSize = berkas.max_size_mb * 1024 * 1024;
        }
      }
    } catch {
      // fallback to global config
    }

    if (file.size > effectiveMaxSize) {
      return error(
        c,
        `Ukuran file melebihi batas maksimal (${Math.round(effectiveMaxSize / 1024 / 1024)}MB) untuk dokumen ini.`,
        422
      );
    }

    // Validate MIME type
    const allowedTypes =
      docType === "foto4x6"
        ? UPLOAD_CONFIG.fotoAllowedMimeTypes
        : UPLOAD_CONFIG.allowedMimeTypes;

    if (!(allowedTypes as readonly string[]).includes(file.type)) {
      return error(
        c,
        `Tipe file tidak diizinkan. Format yang diterima: ${allowedTypes.join(", ")}`,
        422
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If there's an existing file for this docType, delete it first
    const student = await Student.findOne({ nisn }).select("dokumen").lean();
    const existingDoc = student?.dokumen ? (student.dokumen as any)[docType] : null;
    if (existingDoc?.key) {
      try {
        await deleteFromR2(existingDoc.key);
      } catch (deleteErr) {
        // Non-critical: old file deletion failed, continue with upload
        console.warn(`[UPLOAD] Failed to delete old file: ${existingDoc.key}`);
      }
    }

    // Upload to R2
    const result = await uploadToR2(nisn, docType as any, buffer, file.type, file.name);

    // Save document metadata to MongoDB
    const updatePath = `dokumen.${docType}`;
    await Student.updateOne(
      { nisn },
      {
        $set: {
          [updatePath]: {
            key: result.key,
            originalName: file.name,
            size: result.size,
            mimeType: result.mimeType,
            uploadedAt: new Date(),
          },
        },
      }
    );

    return success(
      c,
      {
        docType,
        key: result.key,
        publicUrl: result.publicUrl,
        originalName: file.name,
        size: result.size,
      },
      `Dokumen ${docType} berhasil diunggah.`
    );
  } catch (err: any) {
    console.error("[UPLOAD] uploadDocument error:", err);
    return error(c, "Gagal mengunggah dokumen.", 500);
  }
}

// ============================================
// DELETE /upload/:docType
// Remove an uploaded document from R2
// ============================================

export async function deleteDocument(c: Context) {
  const nisn = c.get("studentNisn");
  const docType = c.req.param("docType") as string;

  // Validate document type
  if (!/^[a-zA-Z0-9_]+$/.test(docType || "")) {
    return error(c, "Tipe dokumen tidak valid.", 400);
  }

  try {
    // Get current document info
    const student = await Student.findOne({ nisn }).select("dokumen").lean();

    if (!student) {
      return error(c, "Data siswa tidak ditemukan.", 404);
    }

    const docInfo = student.dokumen ? (student.dokumen as any)[docType] : null;

    if (!docInfo || !docInfo.key) {
      return error(c, `Dokumen ${docType} belum diunggah.`, 404);
    }

    // Delete from R2
    await deleteFromR2(docInfo.key);

    // Remove from MongoDB
    const updatePath = `dokumen.${docType}`;
    await Student.updateOne(
      { nisn },
      { $set: { [updatePath]: null } }
    );

    return success(c, { docType }, `Dokumen ${docType} berhasil dihapus.`);
  } catch (err: any) {
    console.error("[UPLOAD] deleteDocument error:", err);
    return error(c, "Gagal menghapus dokumen.", 500);
  }
}
