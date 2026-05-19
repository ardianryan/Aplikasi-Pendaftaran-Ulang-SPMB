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
│   │   ├── controllers/      # Handler Logika API (ditambah wa.controller.ts)
│   │   ├── middleware/       # Auth guards, locked guards (form locking)
│   │   ├── models/           # Mongoose Schemas (Student, Admin, Settings, WALog)
│   │   ├── routes/           # Router API endpoints (/api/*)
│   │   ├── services/         # PDF (Puppeteer), Excel (ExcelJS), R2 Storage, ScholarGate SSO, WhatsApp (Gowa, Honowa adapters)
│   │   ├── utils/            # Helpers (Date format, Response standard, Settings Map)
│   │   └── validators/       # Validasi Zod (Auth, Biodata)
│   └── frontend/             # Logika Frontend (Server-Side JSX)
│       ├── layouts/          # Layout Template (Layout.tsx, AdminLayout.tsx)
│       └── pages/            # Komponen Halaman (ditambah AdminWhatsApp.tsx, AdminWhatsAppBlast.tsx, AdminWhatsAppLogs.tsx)
├── public/                   # Static Assets & Client-side Scripting
│   ├── js/                   # Vanilla JS (ditambah js/admin/wa-logic.js, wa-blast-logic.js, wa-logs-logic.js)
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
| `upload_document_enabled` | `boolean` | Status keaktifan upload berkas pada alur wizard pendaftaran siswa |
| `app_logo` | `string` | URL logo utama (disimpan di R2) |
| `app_icon` | `string` | URL favicon aplikasi (diupload ke `/public/favicon.ico` secara lokal) |
| `landing_jalur_json` | `array` | Jalur pendaftaran yang ditampilkan di Landing Page |
| `landing_berkas_json` | `array` | Persyaratan berkas beserta ukuran maksimum per file (`max_size_mb`) |
| `kop_line1` s/d `kop_line6` | `string` | Baris teks pada Kop Surat PDF Buku Induk resmi |
| `url_youtube_tutorial` | `string` | URL video tutorial pengisian di YouTube |
| `url_download_center` | `string` | URL folder download dokumen (surat pernyataan, dll) |
| `wa_gateway_enabled` | `boolean` | Master Switch WhatsApp Gateway (aktif/nonaktif) |
| `wa_gateway_provider` | `string` | Provider WhatsApp Gateway terintegrasi (`gowa` atau `honowa`) |
| `wa_gateway_url` | `string` | URL Endpoint Server WhatsApp Gateway pihak ketiga |
| `wa_gateway_auth_user` | `string` | Username Basic Auth untuk provider `gowa` |
| `wa_gateway_auth_pass` | `string` | Password Basic Auth (`gowa`) / API Token Key (`honowa`) |
| `wa_gateway_device_id` | `string` | Device ID / Session ID untuk gateway WhatsApp |
| `wa_log_retention_days`| `number` | Periode penyimpanan log pesan dalam hari (`7`, `14`, `30`) |
| `wa_template_reminder` | `string` | Template pesan pemberitahuan untuk melakukan daftar ulang |
| `wa_template_biodata`  | `string` | Template pesan untuk menyelesaikan pengisian Buku Induk / Biodata |
| `wa_template_verified` | `string` | Template pesan ketika dokumen registrasi diverifikasi oleh admin |
| `wa_template_rejected` | `string` | Template pesan ketika verifikasi berkas ditolak dengan catatan |

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

### 5.4 Pola WhatsApp Gateway (Adapter & Queue)
1.  **Dynamic Factory:** `createWhatsAppAdapter()` digunakan untuk memuat adapter dinamis berdasarkan setting di DB. Selalu panggil fungsi ini ketimbang menginstansiasi adapter secara manual.
2.  **Graceful Auto-Notifications:** Saat memicu pesan otomatis (seperti notifikasi ketika status pendaftaran berubah di `verifyStudent`), jalankan proses di dalam block `try-catch` terpisah. Kegagalan API Gateway WhatsApp pihak ketiga **tidak boleh** membatalkan atau me-rollback transaksi database registrasi utama.
3.  **Blast Queue & Anti-Ban Delay:** Saat melakukan pengiriman blast secara massal, gunakan delay penundaan minimal **5 detik** antar nomor telepon. Gunakan queue asinkronus agar proses blast tidak memblokir server utama, yang dijalankan di background oleh `processBlastQueue`.
4.  **Logging Standard:** Setiap pesan yang terkirim (sukses/gagal) wajib dicatat dalam model `WALog` dengan informasi pengirim (`sentBy`), penerima, isi pesan, dan detail error jika ada.

---

## ⚠️ 6. Jebakan Umum & Troubleshooting (Gotchas)

1.  **Favicon Upload:** Favicon aplikasi (`app_icon`) ditangani secara lokal dan ditulis langsung ke filesystem kontainer (`/public/favicon.ico`) untuk mempercepat rendering browser. R2 Storage hanya digunakan untuk berkas dokumen siswa dan logo sekolah (`app_logo`).
2.  **State Loading Tombol Wizard:** Di `wizard.js`, saat mengirimkan AJAX, panggil `this.setButtonLoading('id-tombol', true)`. Pastikan untuk mengembalikan state tombol dengan `this.setButtonLoading('id-tombol', false)` di block `finally` agar tombol tidak macet dalam keadaan loading jika proses dihentikan atau modal muncul.
3.  **Accordion Sidebar Admin:** Sidebar admin menggunakan tag HTML `<details>` asli. Pastikan properti `open` dihitung dengan mencocokkan rute yang aktif menggunakan array rute (`currentPath.startsWith(...)`) agar navigasi tidak tertutup otomatis setelah halaman dimuat ulang.
4.  **API.request Auto-Prepend Path:** Pada berkas client-side Javascript, wrapper global `API.request(url, ...)` akan **secara otomatis menambahkan prefix `/api`** di depannya. Oleh karena itu, jangan menuliskan `/api/admin/settings` saat memanggil request, tulislah `/admin/settings` agar url request tidak berlipat ganda menjadi `/api/api/admin/settings` (yang mengakibatkan error 404).
5.  **WhatsApp Integration & Network Host:** Docker Container WhatsApp Gateway (GOWA atau HonoWA) berada di luar kontainer SPMB-WA. Pastikan Host URL yang disimpan di panel konfigurasi admin diakses secara benar via port internal docker network (misal: `http://gowa:3000`) atau via IP publik jika server hosting-nya terpisah.
