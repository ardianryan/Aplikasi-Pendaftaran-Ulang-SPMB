/**
 * Biodata Validation Schemas (Zod)
 * Validates each section of the Buku Induk form
 * Supports partial saves (all fields optional for auto-save)
 * and complete validation (required fields enforced for step completion)
 */

import { z } from "zod";

// ============================================
// Combined Biodata Schema (for auto-save PUT)
// VERY permissive — accepts anything, no strict validation
// Strict validation only happens at completeBiodata step
// ============================================

export const biodataUpdateSchema = z.object({
  biodata: z.record(z.any()).optional(),
  alamat: z.record(z.any()).optional(),
  kesehatan: z.record(z.any()).optional(),
  pendidikan: z.record(z.any()).optional(),
  ayah: z.record(z.any()).optional(),
  ibu: z.record(z.any()).optional(),
  wali: z.record(z.any()).optional(),
  kegemaran: z.record(z.any()).optional(),
});

// ============================================
// Complete Biodata Schema (for step completion)
// Required fields enforced
// ============================================

// Helper: field wajib dipilih (tidak boleh kosong/null/undefined)
function requiredSelect(fieldName: string) {
  return z.any().refine(
    (val) => val !== undefined && val !== null && val !== "",
    { message: `${fieldName} wajib dipilih` }
  );
}

// Helper: field wajib diisi (string, tidak boleh kosong)
function requiredString(fieldName: string) {
  return z.any().refine(
    (val) => typeof val === "string" && val.trim().length > 0,
    { message: `${fieldName} wajib diisi` }
  );
}

// Helper: field wajib diisi (number)
function requiredNumber(fieldName: string, min?: number, max?: number) {
  return z.any().refine(
    (val) => {
      if (val === null || val === undefined) return false;
      const num = typeof val === "number" ? val : Number(val);
      if (isNaN(num)) return false;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    },
    { message: `${fieldName} wajib diisi` }
  );
}


export const biodataCompleteSchema = z.object({
  biodata: z.object({
    namaLengkap: requiredString("Nama lengkap"),
    namaPanggilan: requiredString("Nama panggilan"),
    jenisKelamin: requiredSelect("Jenis kelamin"),
    tempatLahir: requiredString("Tempat lahir"),
    tanggalLahir: z.any().refine(
      (val) => val !== null && val !== undefined && val !== "",
      { message: "Tanggal lahir wajib diisi" }
    ),
    agama: requiredSelect("Agama"),
    kewarganegaraan: requiredString("Kewarganegaraan"),
    nik: z.any().refine(
      (val) => typeof val === "string" && val.length === 16,
      { message: "NIK harus tepat 16 digit" }
    ),
    anakKe: requiredNumber("Anak ke-", 1),
    jumlahSaudara: requiredNumber("Jumlah saudara", 0),
    saudaraKandung: z.any().optional(),
    saudaraTiri: z.any().optional(),
    saudaraAngkat: z.any().optional(),
    statusYatim: requiredSelect("Status anak"),
    bahasaSehari: requiredString("Bahasa sehari-hari"),
  }),
  alamat: z.object({
    alamatLengkap: requiredString("Alamat"),
    telepon: requiredString("Nomor telepon"),
    email: z.any().refine(
      (val) => typeof val === "string" && val.length > 0 && val.includes("@"),
      { message: "Email wajib diisi dengan format yang valid" }
    ),
    tinggalDengan: requiredSelect("Tinggal dengan"),
    jarakSekolah: requiredSelect("Jarak ke sekolah"),
    transportasi: requiredSelect("Transportasi"),
  }),
  kesehatan: z.object({
    golonganDarah: requiredSelect("Golongan darah"),
    penyakit: z.any().optional(),
    kelainanJasmani: z.any().optional(),
    tinggiBadan: requiredNumber("Tinggi badan", 100, 250),
    beratBadan: requiredNumber("Berat badan", 20, 150),
  }),
  pendidikan: z.any().optional(),
  ayah: z.object({
    nama: requiredString("Nama ayah"),
    tempatLahir: z.any().optional(),
    tanggalLahir: z.any().optional(),
    agama: z.any().optional(),
    kewarganegaraan: z.any().optional(),
    pendidikan: z.any().optional(),
    pekerjaan: z.any().optional(),
    penghasilan: z.any().optional(),
    email: z.any().optional(),
    alamat: z.any().optional(),
    telepon: z.any().optional(),
    status: requiredSelect("Status ayah"),
  }),
  ibu: z.object({
    nama: requiredString("Nama ibu"),
    tempatLahir: z.any().optional(),
    tanggalLahir: z.any().optional(),
    agama: z.any().optional(),
    kewarganegaraan: z.any().optional(),
    pendidikan: z.any().optional(),
    pekerjaan: z.any().optional(),
    penghasilan: z.any().optional(),
    email: z.any().optional(),
    alamat: z.any().optional(),
    telepon: z.any().optional(),
    status: requiredSelect("Status ibu"),
  }),
  wali: z.any().optional(),
  kegemaran: z.any().optional(),
});

export type BiodataUpdateInput = z.infer<typeof biodataUpdateSchema>;
export type BiodataCompleteInput = z.infer<typeof biodataCompleteSchema>;
