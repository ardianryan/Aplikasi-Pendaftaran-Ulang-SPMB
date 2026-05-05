/**
 * Setting Model - MongoDB Schema
 * Key-value store for portal configuration
 * (e.g., registration open/close, announcement text, deadlines)
 */

import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: any;
  description: string;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "settings",
  }
);

export const Setting = mongoose.model<ISetting>("Setting", SettingSchema);

// ============================================
// Default Settings (seeded on first run)
// ============================================

export const DEFAULT_SETTINGS = [
  // === Identitas Sekolah & Aplikasi ===
  {
    key: "school_name",
    value: "SMAN 1 Gedeg",
    description: "Nama sekolah yang ditampilkan di seluruh aplikasi",
  },
  {
    key: "school_name_full",
    value: "SMA Negeri 1 Gedeg Kabupaten Mojokerto",
    description: "Nama lengkap sekolah (untuk kop surat/PDF)",
  },
  {
    key: "app_name",
    value: "SPMB",
    description: "Nama/singkatan sistem (misal: SPMB, PPDB, Registrasi Ulang)",
  },
  {
    key: "app_name_full",
    value: "Sistem Penerimaan Murid Baru",
    description: "Kepanjangan nama sistem",
  },
  {
    key: "app_logo",
    value: "",
    description: "URL logo aplikasi (upload via pengaturan, kosong = icon default)",
  },
  {
    key: "app_icon",
    value: "",
    description: "URL favicon/icon aplikasi (upload via pengaturan)",
  },

  // === Kontrol Akses ===
  {
    key: "registration_open",
    value: true,
    description: "Apakah akses login siswa dibuka (true = buka, false = tutup)",
  },
  {
    key: "registration_closed_message",
    value: "Mohon maaf, periode registrasi ulang telah ditutup. Silakan hubungi panitia untuk informasi lebih lanjut.",
    description: "Pesan yang ditampilkan saat registrasi ditutup",
  },

  // === Jadwal ===
  {
    key: "registration_start_date",
    value: "2025-06-01",
    description: "Tanggal mulai registrasi ulang",
  },
  {
    key: "registration_end_date",
    value: "2025-06-30",
    description: "Tanggal akhir registrasi ulang",
  },
  {
    key: "school_year",
    value: "2025/2026",
    description: "Tahun pelajaran aktif",
  },
  {
    key: "verification_deadline",
    value: "2025-07-15",
    description: "Batas akhir verifikasi oleh admin",
  },

  // === Tampilan ===
  {
    key: "announcement_text",
    value: "",
    description: "Teks pengumuman di halaman portal (kosong = tidak tampil)",
  },

  // === Kop Surat / Letterhead (untuk PDF) ===
  {
    key: "kop_line1",
    value: "PEMERINTAH PROVINSI JAWA TIMUR",
    description: "Kop surat baris 1 (instansi atas)",
  },
  {
    key: "kop_line2",
    value: "DINAS PENDIDIKAN",
    description: "Kop surat baris 2",
  },
  {
    key: "kop_line3",
    value: "SEKOLAH MENENGAH ATAS NEGERI 1 GEDEG",
    description: "Kop surat baris 3 (nama sekolah, bold)",
  },
  {
    key: "kop_line4",
    value: "KABUPATEN MOJOKERTO",
    description: "Kop surat baris 4 (kabupaten/kota, bold)",
  },
  {
    key: "kop_line5",
    value: "Jl. Raya Gedeg No. 1, Gedeg, Mojokerto, Jawa Timur 61351",
    description: "Kop surat baris 5 (alamat sekolah)",
  },
  {
    key: "kop_line6",
    value: "NPSN: 20503710 | Email: info@sman1gedeg.sch.id",
    description: "Kop surat baris 6 (NPSN, email, website — ditampilkan seperti alamat)",
  },
  {
    key: "kop_logo_left",
    value: "",
    description: "URL logo kiri pada kop surat (upload)",
  },
  {
    key: "kop_logo_right",
    value: "",
    description: "URL logo kanan pada kop surat (upload)",
  },
  {
    key: "kop_city",
    value: "Mojokerto",
    description: "Nama kota untuk tanggal pada tanda tangan (misal: Mojokerto)",
  },
];
