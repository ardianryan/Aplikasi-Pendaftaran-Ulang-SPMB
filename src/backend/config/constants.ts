/**
 * Application Constants & Enum Options
 * Centralized reference for all dropdown/select options used in forms
 */

// ============================================
// Jalur Penerimaan (Admission Pathways)
// ============================================
export const JALUR_OPTIONS = [
  "Tahap 1", // Afirmasi, Anak Buruh, Pindah Tugas, Prestasi Lomba
  "Tahap 2", // Nilai Prestasi Akademik
  "Tahap 3", // Domisili SMA
] as const;

// ============================================
// Section A: Data Diri
// ============================================
export const JENIS_KELAMIN_OPTIONS = ["Laki-laki", "Perempuan"] as const;

export const AGAMA_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
] as const;

export const STATUS_YATIM_OPTIONS = [
  "Tidak",
  "Yatim",
  "Piatu",
  "Yatim-Piatu",
] as const;

// ============================================
// Section B: Tempat Tinggal
// ============================================
export const TINGGAL_DENGAN_OPTIONS = [
  "Orang Tua",
  "Saudara",
  "Wali",
  "Kost",
  "Asrama",
  "Lainnya",
] as const;

export const JARAK_SEKOLAH_OPTIONS = [
  "< 1 km",
  "1-3 km",
  "3-5 km",
  "5-10 km",
  "> 10 km",
] as const;

export const TRANSPORTASI_OPTIONS = [
  "Jalan Kaki",
  "Sepeda",
  "Sepeda Motor",
  "Mobil Pribadi",
  "Angkutan Umum",
  "Ojek",
  "Lainnya",
] as const;

// ============================================
// Section C: Kesehatan
// ============================================
export const GOLONGAN_DARAH_OPTIONS = [
  "A",
  "B",
  "AB",
  "O",
  "Tidak Tahu",
] as const;

// ============================================
// Section E/F/G: Orang Tua & Wali
// ============================================
export const PENDIDIKAN_OPTIONS = [
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/Sederajat",
  "D1",
  "D2",
  "D3",
  "D4/S1",
  "S2",
  "S3",
  "Tidak Sekolah",
] as const;

export const PENGHASILAN_OPTIONS = [
  "< Rp 1.000.000",
  "Rp 1.000.000 - Rp 3.000.000",
  "Rp 3.000.000 - Rp 5.000.000",
  "Rp 5.000.000 - Rp 10.000.000",
  "> Rp 10.000.000",
] as const;

export const STATUS_HIDUP_OPTIONS = [
  "Masih Hidup",
  "Meninggal Dunia",
] as const;

// ============================================
// Verification Status
// ============================================
export const VERIFIKASI_STATUS_OPTIONS = [
  "pending",
  "verified",
  "rejected",
] as const;

// ============================================
// Document Types (for upload)
// ============================================
export const DOCUMENT_TYPES = [
  "kartuKeluarga",
  "ijazahSkl",
  "aktaKelahiran",
  "foto4x6",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// ============================================
// File Upload Constraints
// ============================================
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ],
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
  // Foto only allows images
  fotoAllowedMimeTypes: ["image/jpeg", "image/jpg", "image/png"],
} as const;

// ============================================
// Wizard Steps
// ============================================
export const WIZARD_STEPS = {
  CONFIRM: 1,
  BIODATA: 2,
  UPLOAD: 3,
  REVIEW: 4,
  DONE: 5,
} as const;

// ============================================
// Admin Roles
// ============================================
export const ADMIN_ROLES = ["admin", "operator"] as const;
