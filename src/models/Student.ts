/**
 * Student Model - MongoDB Schema
 * Contains all 72 form fields from Buku Induk + system metadata
 * Organized into nested subdocuments by section (A-H)
 */

import mongoose, { Schema, Document } from "mongoose";
import {
  JENIS_KELAMIN_OPTIONS,
  AGAMA_OPTIONS,
  STATUS_YATIM_OPTIONS,
  TINGGAL_DENGAN_OPTIONS,
  JARAK_SEKOLAH_OPTIONS,
  TRANSPORTASI_OPTIONS,
  GOLONGAN_DARAH_OPTIONS,
  PENDIDIKAN_OPTIONS,
  PENGHASILAN_OPTIONS,
  STATUS_HIDUP_OPTIONS,
  VERIFIKASI_STATUS_OPTIONS,

  WIZARD_STEPS,
} from "../config/constants";

// ============================================
// TypeScript Interfaces
// ============================================

interface IDocument {
  key: string; // R2 object key
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

interface IDokumenVerifikasi {
  status: "pending" | "valid" | "rejected";
  catatan?: string;
}

export interface IStudent extends Document {
  // System / Pre-register fields
  nisn: string;
  jalur: string;
  noDiterima: string;
  asalSmpPreRegister: string;
  namaPreRegister: string;
  tanggalLahirPreRegister: Date;

  // Wizard state
  wizardStep: number;
  isSubmitted: boolean;
  submittedAt: Date | null;

  // Section A: Data Diri Peserta Didik
  biodata: {
    namaLengkap: string;
    namaPanggilan: string;
    jenisKelamin: string;
    tempatLahir: string;
    tanggalLahir: Date;
    agama: string;
    kewarganegaraan: string;
    nik: string;
    anakKe: number;
    jumlahSaudara: number;
    saudaraKandung: number;
    saudaraTiri: number;
    saudaraAngkat: number;
    statusYatim: string;
    bahasaSehari: string;
  };

  // Section B: Tempat Tinggal
  alamat: {
    alamatLengkap: string;
    telepon: string;
    email: string;
    tinggalDengan: string;
    jarakSekolah: string;
    transportasi: string;
  };

  // Section C: Kesehatan
  kesehatan: {
    golonganDarah: string;
    penyakit: string;
    kelainanJasmani: string;
    tinggiBadan: number;
    beratBadan: number;
  };

  // Section D: Pendidikan
  pendidikan: {
    asalSekolah: string;
    nomorIjazah: string;
    lamaBelajar: string;
    kelas: string;
  };

  // Section E: Ayah Kandung
  ayah: {
    nama: string;
    tempatLahir: string;
    tanggalLahir: Date | null;
    agama: string;
    kewarganegaraan: string;
    pendidikan: string;
    pekerjaan: string;
    penghasilan: string;
    email: string;
    alamat: string;
    telepon: string;
    status: string;
  };

  // Section F: Ibu Kandung
  ibu: {
    nama: string;
    tempatLahir: string;
    tanggalLahir: Date | null;
    agama: string;
    kewarganegaraan: string;
    pendidikan: string;
    pekerjaan: string;
    penghasilan: string;
    email: string;
    alamat: string;
    telepon: string;
    status: string;
  };

  // Section G: Wali (optional)
  wali: {
    nama: string;
    tempatLahir: string;
    tanggalLahir: Date | null;
    agama: string;
    kewarganegaraan: string;
    pendidikan: string;
    pekerjaan: string;
    penghasilan: string;
    email: string;
    alamat: string;
    telepon: string;
    status: string;
  };

  // Section H: Kegemaran
  kegemaran: {
    kesenian: string;
    olahraga: string;
    organisasi: string;
    lainLain: string;
  };

  // Documents (Step 3)
  dokumen: {
    kartuKeluarga: IDocument | null;
    ijazahSkl: IDocument | null;
    aktaKelahiran: IDocument | null;
    foto4x6: IDocument | null;
  };

  // Verification (Admin)
  verifikasi: {
    status: "pending" | "verified" | "rejected";
    verifiedBy: mongoose.Types.ObjectId | null;
    verifiedAt: Date | null;
    catatan: string;
    dokumenStatus: {
      kartuKeluarga: IDokumenVerifikasi;
      ijazahSkl: IDokumenVerifikasi;
      aktaKelahiran: IDokumenVerifikasi;
      foto4x6: IDokumenVerifikasi;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Sub-schemas
// ============================================

const DocumentSubSchema = new Schema(
  {
    key: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DokumenVerifikasiSubSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "valid", "rejected"],
      default: "pending",
    },
    catatan: { type: String, default: "" },
  },
  { _id: false }
);

// Parent/Guardian shared schema factory
function createOrangTuaSchema(required: boolean = false) {
  return new Schema(
    {
      nama: { type: String, default: "" },
      tempatLahir: { type: String, default: "" },
      tanggalLahir: { type: Date, default: null },
      agama: { type: String, enum: [...AGAMA_OPTIONS, ""], default: "" },
      kewarganegaraan: { type: String, default: "WNI" },
      pendidikan: {
        type: String,
        enum: [...PENDIDIKAN_OPTIONS, ""],
        default: "",
      },
      pekerjaan: { type: String, default: "" },
      penghasilan: {
        type: String,
        enum: [...PENGHASILAN_OPTIONS, ""],
        default: "",
      },
      email: { type: String, default: "" },
      alamat: { type: String, default: "" },
      telepon: { type: String, default: "" },
      status: {
        type: String,
        enum: [...STATUS_HIDUP_OPTIONS, ""],
        default: "",
      },
    },
    { _id: false }
  );
}

// ============================================
// Main Student Schema
// ============================================

const StudentSchema = new Schema<IStudent>(
  {
    // === SYSTEM / PRE-REGISTER FIELDS ===
    nisn: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 10,
      maxlength: 10,
    },
    jalur: {
      type: String,
      required: true,
    },
    noDiterima: { type: String, default: "" },
    asalSmpPreRegister: { type: String, default: "" },
    namaPreRegister: { type: String, required: true },
    tanggalLahirPreRegister: { type: Date, required: true },

    // === WIZARD STATE ===
    wizardStep: {
      type: Number,
      default: WIZARD_STEPS.CONFIRM,
      min: 1,
      max: 5,
    },
    isSubmitted: { type: Boolean, default: false, index: true },
    submittedAt: { type: Date, default: null },

    // === SECTION A: Data Diri ===
    biodata: {
      type: new Schema(
        {
          namaLengkap: { type: String, default: "" },
          namaPanggilan: { type: String, default: "" },
          jenisKelamin: {
            type: String,
            enum: [...JENIS_KELAMIN_OPTIONS, ""],
            default: "",
          },
          tempatLahir: { type: String, default: "" },
          tanggalLahir: { type: Date, default: null },
          agama: { type: String, enum: [...AGAMA_OPTIONS, ""], default: "" },
          kewarganegaraan: { type: String, default: "WNI" },
          nik: { type: String, default: "", minlength: 0, maxlength: 16 },
          anakKe: { type: Number, default: null },
          jumlahSaudara: { type: Number, default: null },
          saudaraKandung: { type: Number, default: null },
          saudaraTiri: { type: Number, default: null },
          saudaraAngkat: { type: Number, default: null },
          statusYatim: {
            type: String,
            enum: [...STATUS_YATIM_OPTIONS, ""],
            default: "",
          },
          bahasaSehari: { type: String, default: "" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // === SECTION B: Tempat Tinggal ===
    alamat: {
      type: new Schema(
        {
          alamatLengkap: { type: String, default: "" },
          telepon: { type: String, default: "" },
          email: { type: String, default: "" },
          tinggalDengan: {
            type: String,
            enum: [...TINGGAL_DENGAN_OPTIONS, ""],
            default: "",
          },
          jarakSekolah: {
            type: String,
            enum: [...JARAK_SEKOLAH_OPTIONS, ""],
            default: "",
          },
          transportasi: {
            type: String,
            enum: [...TRANSPORTASI_OPTIONS, ""],
            default: "",
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // === SECTION C: Kesehatan ===
    kesehatan: {
      type: new Schema(
        {
          golonganDarah: {
            type: String,
            enum: [...GOLONGAN_DARAH_OPTIONS, ""],
            default: "",
          },
          penyakit: { type: String, default: "" },
          kelainanJasmani: { type: String, default: "" },
          tinggiBadan: { type: Number, default: null },
          beratBadan: { type: Number, default: null },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // === SECTION D: Pendidikan ===
    pendidikan: {
      type: new Schema(
        {
          asalSekolah: { type: String, default: "" },
          nomorIjazah: { type: String, default: "" },
          lamaBelajar: { type: String, default: "" },
          kelas: { type: String, default: "X" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // === SECTION E: Ayah Kandung ===
    ayah: { type: createOrangTuaSchema(true), default: () => ({}) },

    // === SECTION F: Ibu Kandung ===
    ibu: { type: createOrangTuaSchema(true), default: () => ({}) },

    // === SECTION G: Wali (optional) ===
    wali: { type: createOrangTuaSchema(false), default: () => ({}) },

    // === SECTION H: Kegemaran ===
    kegemaran: {
      type: new Schema(
        {
          kesenian: { type: String, default: "" },
          olahraga: { type: String, default: "" },
          organisasi: { type: String, default: "" },
          lainLain: { type: String, default: "" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // === DOCUMENTS (Step 3) ===
    dokumen: {
      type: new Schema(
        {
          kartuKeluarga: { type: DocumentSubSchema, default: null },
          ijazahSkl: { type: DocumentSubSchema, default: null },
          aktaKelahiran: { type: DocumentSubSchema, default: null },
          foto4x6: { type: DocumentSubSchema, default: null },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // === VERIFICATION (Admin) ===
    verifikasi: {
      type: new Schema(
        {
          status: {
            type: String,
            enum: VERIFIKASI_STATUS_OPTIONS,
            default: "pending",
            index: true,
          },
          verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
          },
          verifiedAt: { type: Date, default: null },
          catatan: { type: String, default: "" },
          dokumenStatus: {
            type: new Schema(
              {
                kartuKeluarga: {
                  type: DokumenVerifikasiSubSchema,
                  default: () => ({}),
                },
                ijazahSkl: {
                  type: DokumenVerifikasiSubSchema,
                  default: () => ({}),
                },
                aktaKelahiran: {
                  type: DokumenVerifikasiSubSchema,
                  default: () => ({}),
                },
                foto4x6: {
                  type: DokumenVerifikasiSubSchema,
                  default: () => ({}),
                },
              },
              { _id: false }
            ),
            default: () => ({}),
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: "students",
  }
);

// ============================================
// Indexes for query performance
// ============================================

StudentSchema.index({ jalur: 1 });
StudentSchema.index({ "verifikasi.status": 1 });
StudentSchema.index({ isSubmitted: 1, "verifikasi.status": 1 });
StudentSchema.index({ namaPreRegister: "text" }); // Text search on name

export const Student = mongoose.model<IStudent>("Student", StudentSchema);
