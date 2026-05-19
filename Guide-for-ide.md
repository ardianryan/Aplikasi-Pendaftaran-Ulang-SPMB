# 🎓 Guide-for-ide.md — Comprehensive IDE & AI Developer Guide

Panduan resmi untuk **AI Coding Assistant** dan **Developers** saat membaca, memodifikasi, atau mengembangkan basis kode **SPMB-WA** (Sistem Registrasi Ulang Siswa Baru).

> [!IMPORTANT]
> **BACA SEBELUM MENULIS KODE:** Proyek ini menggunakan arsitektur hybrid **Hono Server-Side JSX (React-like syntax rendered on the server)** dengan interaksi client-side berbasis **Vanilla JS** di direktori `/public`. Jangan menambahkan build step baru, jangan menggunakan client-side React framework bundle, dan selalu ikuti batasan arsitektur di bawah ini agar kode tidak berantakan ("tidak ngamplah").

---

## 🗺️ 1. Peta Navigasi Direktori & Kode

```
spmb-wa/
├── src/
│   ├── index.tsx             # Entrypoint utama aplikasi (Routing Pages & API)
│   ├── backend/              # Logika Backend (Server-Side)
│   │   ├── config/           # Database (Mongoose), R2 Storage, Constants (Enums)
│   │   ├── controllers/      # Handler Logika API
│   │   ├── middleware/       # Auth guards, locked guards (form locking)
│   │   ├── models/           # Mongoose Schemas (Student, Admin, Settings, Referral)
│   │   ├── routes/           # Router API endpoints (/api/*)
│   │   ├── services/         # PDF (Puppeteer), Excel (ExcelJS), R2 Storage, JWT, ScholarGate SSO
│   │   ├── utils/            # Helpers (Date format, Response standard, Settings Map)
│   │   └── validators/       # Validasi Zod (Auth, Biodata)
│   └── frontend/             # Logika Frontend (Server-Side JSX)
│       ├── layouts/          # Layout Template (Layout.tsx, AdminLayout.tsx)
│       └── pages/            # Komponen Halaman (Landing.tsx, Wizard.tsx, AdminDashboard.tsx)
├── public/                   # Static Assets & Client-side Scripting
│   ├── js/                   # Vanilla JS untuk interaksi dinamis (wizard.js, api.js, ui.js)
│   ├── css/                  # Styling kustom (Tailwind CDN base kustom)
│   └── favicon.ico           # Target upload Favicon lokal dinamis
└── Dockerfile & docker-setup.sh # Konfigurasi deployment & containerization
```

---

## ⚡ 2. Arsitektur Inti & Batasan Teknologi

### 2.1 Server-Side Hono JSX (Bukan Client-Side React)
*   Semua halaman di `src/frontend/pages` di-render di server oleh Hono menggunakan `hono/jsx`.
*   **Aturan Wajib JSX:** Setiap file `.tsx` harus dimulai dengan baris berikut:
    ```tsx
    /** @jsxImportSource hono/jsx */
    import { jsx } from 'hono/jsx';
    ```
*   **JANGAN PERNAH** mengimpor `React` (`import React from 'react'`) karena proyek ini tidak menggunakan library React sama sekali.

### 2.2 Client-Side Vanilla JS & Styling
*   Untuk interaksi UI dinamis (seperti navigasi wizard langkah 1-5, AJAX, drag-and-drop upload), gunakan file JS murni di `/public/js/`.
    *   `public/js/api.js`: Wrapper fetch API global.
    *   `public/js/ui.js`: Komponen toast kustom, dialog konfirmasi.
    *   `public/js/wizard.js`: State machine langkah-demi-langkah pengisian siswa.
*   **CSS & UI Framework:** Proyek ini menggunakan **Tailwind CSS via CDN** dikombinasikan dengan Vanilla CSS kustom di `Landing.tsx` atau layout pendukung untuk performa maksimal tanpa compile step.

---

## 🔒 3. Logika Bisnis & Aturan Keamanan Penting

### 3.1 Kunci Pengisian (`lockedGuard`)
*   Siswa baru mengisi data dalam 5 tahap (Wizard). Setelah menekan **Konfirmasi Akhir (Langkah 4)**, status data di database berubah menjadi `isSubmitted: true`.
*   Semua API yang memodifikasi data siswa (`PUT /api/student/*`, `POST /api/upload`) **wajib** melewati middleware `lockedGuard`.
*   Jika `isSubmitted: true`, semua akses tulis akan diblokir dengan respons `403 Forbidden`. Jangan melompati proteksi ini.

### 3.2 Auto-Save Biodata (Step 2)
*   Siswa mengisi formulir biodata yang besar pada langkah 2.
*   Logika di `public/js/wizard.js` mendeteksi perubahan input dan melakukan auto-save menggunakan debounce 3 detik ke `PUT /api/student/biodata`.
*   Skema validasi Zod untuk auto-save bersifat **permissive** (mengizinkan field kosong) agar siswa bisa mencicil pengisian. Validasi **strict** baru dijalankan pada Langkah 4 sebelum final submission.

### 3.3 Skema Database Utama (`Student.ts`)
*   Data disimpan dalam struktur dokumen bersarang tunggal (nested document) di MongoDB.
*   Sub-dokumen utama meliputi: `biodata`, `alamat`, `kesehatan`, `pendidikan`, `ayah`, `ibu`, `wali`, `dokumen`, `verifikasi`.
*   Pencarian admin menggunakan indeks teks pada kolom `namaPreRegister`.

---

## ⚙️ 4. Pengaturan Sistem Dinamis (MongoDB `settings`)

Aplikasi ini sangat bergantung pada koleksi `settings` untuk branding dinamis dan pengaturan alur pendaftaran. Gunakan kunci berikut secara konsisten (jangan membuat kunci baru secara sembarangan):

| Nama Kunci (`key`) | Tipe Data | Deskripsi |
|-------------------|-----------|-----------|
| `app_name` | `string` | Singkatan nama aplikasi (contoh: "SPMB" atau "PPDB") |
| `school_name` | `string` | Nama sekolah (contoh: "SMAN 1 Gedeg") |
| `registration_open` | `boolean` | Status gerbang pendaftaran (bisa membuka/menutup seluruh form wizard siswa) |
| `app_logo` | `string` | URL logo utama (disimpan di R2) |
| `app_icon` | `string` | URL favicon aplikasi (diupload ke `/public/favicon.ico` secara lokal) |
| `landing_jalur_json` | `array` | Jalur pendaftaran yang ditampilkan di Landing Page |
| `landing_berkas_json` | `array` | Persyaratan berkas beserta ukuran maksimum per file (`max_size_mb`) |
| `kop_line1` s/d `kop_line6` | `string` | Baris teks pada Kop Surat PDF Buku Induk resmi |

---

## 🛠️ 5. Pola Pengembangan Umum (How-To)

### 5.1 Menambahkan Pengaturan Baru (Settings)
1.  Daftarkan kunci baru beserta nilai bawaannya di `src/backend/models/Setting.ts` pada array `DEFAULT_SETTINGS`.
2.  Gunakan helper `getSettingsMap()` dari `@backend/utils/settings` untuk mengambil seluruh pengaturan dalam format objek `key-value` yang mudah digunakan di frontend.
3.  Modifikasi `src/frontend/pages/AdminSettings.tsx` untuk menyediakan UI pengubahannya.

### 5.2 Menambahkan Validasi Input Baru
1.  Buka `src/backend/validators/biodata.schema.ts`.
2.  Perbarui schema Zod yang sesuai (`biodataSaveSchema` untuk auto-save longgar, `biodataCompleteSchema` untuk pengecekan akhir yang ketat).
3.  Pastikan pesan error dalam Bahasa Indonesia untuk kemudahan siswa baru.

### 5.3 Memodifikasi Tampilan Halaman Siswa/Admin
1.  Identifikasi halaman di `src/frontend/pages/`.
2.  Semua visualisasi premium wajib menggunakan kombinasi class Tailwind. Hindari warna mentah seperti `bg-red-500` yang terlalu mencolok, gunakan sistem palet yang telah disediakan (seperti `bg-primary`, `bg-secondary`, `bg-slate-50`).
3.  Pastikan responsivitas mobile selalu dicek. Gunakan prefix responsive Tailwind (`sm:`, `md:`, `lg:`) pada semua komponen tata letak.

---

## ⚠️ 6. Jebakan Umum & Troubleshooting (Gotchas)

1.  **Favicon Upload:** Favicon aplikasi (`app_icon`) ditangani secara lokal dan ditulis langsung ke filesystem kontainer (`/public/favicon.ico`) untuk mempercepat rendering browser. R2 Storage hanya digunakan untuk berkas dokumen siswa dan logo sekolah (`app_logo`).
2.  **State Loading Tombol Wizard:** Di `wizard.js`, saat mengirimkan AJAX, panggil `this.setButtonLoading('id-tombol', true)`. Pastikan untuk mengembalikan state tombol dengan `this.setButtonLoading('id-tombol', false)` di block `finally` agar tombol tidak macet dalam keadaan loading jika proses dihentikan atau modal muncul.
3.  **Accordion Sidebar Admin:** Sidebar admin menggunakan tag HTML `<details>` asli. Pastikan properti `open` dihitung dengan mencocokkan rute yang aktif menggunakan array rute (`currentPath.startsWith(...)`) agar navigasi tidak tertutup otomatis setelah halaman dimuat ulang.
