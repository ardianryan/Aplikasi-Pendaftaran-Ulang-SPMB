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
    key: "upload_document_enabled",
    value: true,
    description: "Apakah siswa wajib mengunggah berkas persyaratan (true = aktif, false = nonaktif/dilewati)",
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

  // === Landing Page Content ===
  {
    key: "landing_hero_title",
    value: "Registrasi Ulang SPMB 2024",
    description: "Judul besar di halaman landing",
  },
  {
    key: "landing_hero_title_accent",
    value: "SPMB 2024",
    description: "Judul berwarna gradasi di bawah judul utama",
  },
  {
    key: "landing_hero_subtitle",
    value: "Selamat datang calon peserta didik baru. Selesaikan tahapan akhir pendaftaran Anda untuk menjadi bagian dari generasi berprestasi SMAN 1 Gedeg.",
    description: "Sub-judul di bawah judul besar landing",
  },
  {
    key: "landing_jalur_json",
    value: [
      { title: "Zonasi", icon: "share_location", desc: "Berdasarkan jarak domisili ke sekolah sesuai alamat pada Kartu Keluarga." },
      { title: "Prestasi", icon: "emoji_events", desc: "Akademik & non-akademik tingkat regional hingga internasional.", badge: "Unggulan" },
      { title: "Afirmasi", icon: "handshake", desc: "Keluarga ekonomi tidak mampu, penyandang disabilitas, dan pindah tugas." },
    ],
    description: "Daftar jalur pendaftaran (JSON)",
  },
  {
    key: "landing_timeline_json",
    value: [
      { date: "12 - 16 Juni 2024", title: "Pendaftaran Online", desc: "Pengisian formulir dan pemilihan jalur pendaftaran melalui portal.", icon: "rocket_launch" },
      { date: "13 - 17 Juni 2024", title: "Verifikasi Berkas", desc: "Pengecekan keabsahan dokumen fisik oleh panitia di sekolah.", icon: "verified" },
      { date: "20 Juni 2024", title: "Pengumuman", desc: "Hasil seleksi final diumumkan secara serentak di portal.", icon: "campaign", highlight: true },
    ],
    description: "Linimasa pendaftaran (JSON)",
  },
  {
    key: "landing_berkas_json",
    value: [
      { id: "kartu_keluarga", title: "Kartu Keluarga", icon: "contact_page", desc: "Diterbitkan minimal 1 tahun sebelum tanggal pendaftaran.", required: true, active: true, jalur: ["all"] },
      { id: "ijazah_skl", title: "SKL / Ijazah", icon: "school", desc: "Surat Keterangan Lulus dari SMP/MTs asal.", required: true, active: true, jalur: ["all"] },
      { id: "akta_kelahiran", title: "Akta Kelahiran", icon: "child_care", desc: "Scan dokumen asli bewarna.", required: true, active: true, jalur: ["all"] },
      { id: "pas_foto", title: "Pas Foto 4x6", icon: "image", desc: "Latar belakang merah, format JPG/PNG.", required: true, active: true, jalur: ["all"] },
      { id: "piagam_prestasi", title: "Piagam Prestasi", icon: "military_tech", desc: "Scan piagam asli (hanya untuk jalur prestasi).", required: true, active: false, jalur: ["Prestasi"] },
    ],
    description: "Daftar berkas wajib & kondisional (JSON)",
  },
  {
    key: "admission_paths",
    value: [
      { name: "Zonasi", active: true },
      { name: "Prestasi", active: true },
      { name: "Afirmasi", active: true },
      { name: "Perpindahan Tugas", active: true },
    ],
    description: "Master daftar jalur pendaftaran (JSON)",
  },
  {
    key: "url_youtube_tutorial",
    value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "URL Video Tutorial Pengisian di YouTube",
  },
  {
    key: "url_download_center",
    value: "https://docs.google.com/document/d/1example/edit",
    description: "URL Folder/Dokumen Download Center (surat pernyataan, dll)",
  },

  // === WhatsApp Gateway ===
  {
    key: "wa_gateway_enabled",
    value: false,
    description: "Master switch fitur WhatsApp gateway (true = aktif)",
  },
  {
    key: "wa_gateway_provider",
    value: "gowa",
    description: "Provider WA gateway aktif: gowa atau honowa",
  },
  {
    key: "wa_gateway_url",
    value: "",
    description: "Base URL gateway WA (contoh: http://gowa:3000)",
  },
  {
    key: "wa_gateway_auth_user",
    value: "",
    description: "Username untuk Basic Auth GOWA (kosongkan jika tidak ada)",
  },
  {
    key: "wa_gateway_auth_pass",
    value: "",
    description: "Password Basic Auth GOWA / API Key HonoWA",
  },
  {
    key: "wa_gateway_device_id",
    value: "",
    description: "Device ID (GOWA v8) atau Session ID (HonoWA)",
  },
  {
    key: "wa_log_retention_days",
    value: 30,
    description: "Lama penyimpanan log WA dalam hari (7/14/30)",
  },
  {
    key: "wa_template_reminder",
    value: "Assalamu'alaikum {{nama}} 👋\n\nSelamat! Anda telah dinyatakan LULUS seleksi SPMB {{sekolah}} Tahun Pelajaran {{tahun}} melalui jalur {{jalur}}.\n\n📋 Segera lakukan *Daftar Ulang Online* melalui:\n🔗 {{url}}\n\nNISN Anda: *{{nisn}}*\n\nHarap segera mengisi data sebelum batas waktu yang ditentukan.\n\nTerima kasih 🙏\n_Panitia SPMB {{sekolah}}_",
    description: "Template pesan reminder daftar ulang",
  },
  {
    key: "wa_template_biodata",
    value: "Halo {{nama}} 👋\n\nData daftar ulang Anda sudah dikonfirmasi. Namun, *pengisian Buku Induk belum selesai*.\n\nSilakan login kembali dan lengkapi seluruh data:\n🔗 {{url}}\n\nTerima kasih 🙏\n_Panitia SPMB {{sekolah}}_",
    description: "Template pesan reminder isi buku induk",
  },
  {
    key: "wa_template_verified",
    value: "Halo {{nama}} 👋\n\n✅ Data daftar ulang Anda di {{sekolah}} telah *DIVERIFIKASI* dan dinyatakan lengkap.\n\nSelamat bergabung!\n\nTerima kasih 🙏\n_Panitia SPMB {{sekolah}}_",
    description: "Template notifikasi data terverifikasi",
  },
  {
    key: "wa_template_rejected",
    value: "Halo {{nama}} 👋\n\n❌ Mohon maaf, data daftar ulang Anda di {{sekolah}} *DITOLAK* oleh verifikator.\n\nSilakan periksa kembali data Anda dan perbaiki sesuai catatan:\n🔗 {{url}}\n\nTerima kasih 🙏\n_Panitia SPMB {{sekolah}}_",
    description: "Template notifikasi data ditolak",
  },

  // === Antrean ===
  {
    key: "queue_pre_reg_prefix",
    value: "A",
    description: "Prefix nomor antrean mode Pra-Pendaftaran (misal: A → A001, A002)",
  },
  {
    key: "queue_re_reg_prefix",
    value: "B",
    description: "Prefix nomor antrean mode Daftar Ulang (misal: B → B001, B002)",
  },
  {
    key: "queue_counter_count",
    value: 5,
    description: "Jumlah loket antrean aktif (1–20, default 5)",
  },
  {
    key: "queue_counter_names",
    value: ["Loket 1", "Loket 2", "Loket 3", "Loket 4", "Loket 5"],
    description: "Nama-nama loket antrean (JSON array, panjang harus sama dengan queue_counter_count)",
  },
  {
    key: "queue_student_link_enabled",
    value: false,
    description: "Aktifkan link nomor antrean ke data siswa (true = tampilkan nama/NISN siswa di panel loket dan display TV)",
  },
  {
    key: "queue_display_title",
    value: "Antrean Verifikasi SPMB",
    description: "Judul utama yang ditampilkan di layar display antrean publik",
  },
  {
    key: "queue_display_subtitle",
    value: "",
    description: "Sub-judul opsional di bawah judul display antrean (kosong = tidak tampil)",
  },
  {
    key: "queue_display_show_waiting",
    value: true,
    description: "Tampilkan daftar nomor menunggu di sisi kanan display publik",
  },
  {
    key: "queue_number_padding",
    value: 3,
    description: "Jumlah digit nomor antrean (3 = A001, 2 = A01, 4 = A0001)",
  },
  {
    key: "queue_display_announcement_type",
    value: "none",
    description: "Jenis pengumuman display TV antrean (none = tidak tampil, html = kustom visual editor, youtube = video youtube)",
  },
  {
    key: "queue_display_announcement_html",
    value: `<h3 class="font-bold text-lg text-blue-400 mb-2">📢 Alur & Persyaratan Verifikasi Berkas</h3>\n<p class="text-xs text-slate-300 mb-3">Mohon persiapkan dokumen fisik berikut sebelum menuju ke loket panggilan:</p>\n<ul class="text-xs text-slate-300 space-y-1.5 list-none pl-0">\n  <li class="flex items-center gap-2"><span class="text-emerald-400 font-bold">✓</span> Bukti Pendaftaran Online (dicetak dari portal)</li>\n  <li class="flex items-center gap-2"><span class="text-emerald-400 font-bold">✓</span> Fotokopi Akta Kelahiran & Kartu Keluarga asli</li>\n  <li class="flex items-center gap-2"><span class="text-emerald-400 font-bold">✓</span> Surat Keterangan Lulus (SKL) asli dari SMP</li>\n  <li class="flex items-center gap-2"><span class="text-emerald-400 font-bold">✓</span> Pas foto hitam-putih / berwarna ukuran 3x4 (2 lembar)</li>\n</ul>`,
    description: "Teks pengumuman berformat HTML kustom untuk display publik antrean",
  },
  {
    key: "queue_display_announcement_yt_id",
    value: "dQw4w9WgXcQ",
    description: "ID video YouTube untuk diputar di display publik antrean (misal: dQw4w9WgXcQ)",
  },
  {
    key: "queue_display_theme",
    value: "dark",
    description: "Tema bawaan awal display publik antrean (dark = gelap, light = terang)",
  },
  // === Hak Akses Operator ===
  {
    key: "operator_can_verify",
    value: true,
    description: "Operator diizinkan melakukan verifikasi berkas pendaftar",
  },
  {
    key: "operator_can_edit_student",
    value: true,
    description: "Operator diizinkan menambah data manual dan mengubah biodata siswa",
  },
  {
    key: "operator_can_delete_student",
    value: false,
    description: "Operator diizinkan menghapus data siswa",
  },
  {
    key: "operator_can_whatsapp",
    value: false,
    description: "Operator diizinkan mengelola fitur WhatsApp Gateway dan logs",
  },
  {
    key: "operator_can_manage_queue",
    value: true,
    description: "Operator diizinkan mengelola antrean (panggil, lewati, atur loket)",
  },
];
