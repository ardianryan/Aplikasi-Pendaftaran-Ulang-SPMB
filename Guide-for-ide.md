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
│   │   ├── controllers/      # Handler Logika API (ditambah wa.controller.ts, queue.controller.ts)
│   │   ├── middleware/       # Auth guards, locked guards (form locking)
│   │   ├── models/           # Mongoose Schemas (Student, Admin, Settings, WALog)
│   │   ├── routes/           # Router API endpoints (/api/*)
│   │   ├── services/         # PDF (Puppeteer), Excel, R2 Storage, SSO, WhatsApp, Queue (queue.service.ts, queue.sse.ts)
│   │   ├── utils/            # Helpers (Date format, Response standard, Settings Map)
│   │   └── validators/       # Validasi Zod (Auth, Biodata)
│   └── frontend/             # Logika Frontend (Server-Side JSX)
│       ├── layouts/          # Layout Template (Layout.tsx, AdminLayout.tsx)
│       └── pages/            # Komponen Halaman (termasuk QueueDisplay.tsx, AdminQueue*.tsx, AdminWhatsApp*.tsx)
├── public/                   # Static Assets & Client-side Scripting
│   ├── js/                   # Vanilla JS (termasuk antrean: queue-display.js, queue-logic.js)
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

### 2.3 Durasi Sesi Kerja Operator (8 Jam)
*   JWT token didesain kedaluwarsa dalam waktu **8 jam** secara default (`JWT_EXPIRES_IN || "8h"`). Ini memungkinkan operator bekerja sepanjang jam dinas tatap muka tanpa perlu melakukan login ulang berkali-kali.

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

### 3.4 Aturan Peran Operator & Hak Akses Dinamis (`role-guard.js`)
*   Sistem memisahkan hak akses menjadi `admin` dan `operator`.
*   Hak akses operator dikonfigurasi secara dinamis oleh Super Admin melalui Dashboard Pengaturan dengan parameter tersimpan di DB:
    *   `operator_can_verify`: Hak melakukan verifikasi dokumen siswa.
    *   `operator_can_edit_student`: Hak mengedit biodata siswa.
    *   `operator_can_delete_student`: Hak menghapus data siswa.
    *   `operator_can_whatsapp`: Hak mengelola/mengirim broadcast WhatsApp.
    *   `operator_can_manage_queue`: Hak mengelola sesi dan panggilan antrean.
*   **Enforcement:**
    *   **Client-Side:** `/public/js/admin/role-guard.js` memuat pengaturan ini dan secara otomatis menyembunyikan navigasi menu atau elemen tombol tertentu serta melakukan redirect ke dashboard jika operator memaksa mengakses halaman terlarang.
    *   **Server-Side:** API dilindungi dengan middleware `requireAdmin` (untuk aksi khusus Super Admin) atau middleware berbasis role spesifik di `src/backend/middleware/auth.middleware.ts`.

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
| `queue_display_title`  | `string` | Judul pada layar display antrean publik (TV) |
| `queue_display_footer` | `string` | Teks berjalan (marquee) di bagian bawah layar antrean |
| `queue_media_type`     | `string` | Tipe media pengumuman (`none`, `html`, `youtube`) |
| `queue_media_html`     | `string` | Konten pengumuman berbasis HTML (Quill Editor) |
| `queue_media_youtube_id`| `string`| ID Video YouTube untuk diputar otomatis di display antrean |

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

### 5.5 Arsitektur Antrean (Server-Sent Events & Sesi Batch MongoDB)
1.  **State Management & MongoDB Persistence:** Data sesi antrean aktif (`queues`) dan tiket antrean (`queue_tickets`) disimpan di database MongoDB untuk durabilitas dan pemantauan historis. Tiket antrean diterbitkan secara batch sesuai ukuran batch yang dimasukkan admin saat memulai sesi.
2.  **Auto-Cleanup & Lanjutan Cerdas:** 
    *   Saat sesi antrean diakhiri (baik manual lewat tombol akhiri sesi maupun implisit saat sesi baru dimulai), seluruh tiket tersisa yang masih berstatus `"waiting"` otomatis **dihapus** demi efisiensi DB.
    *   Nomor terakhir yang diterbitkan (`lastIssuedNumber`) diperbarui menjadi nomor urut tiket terakhir yang **benar-benar dipanggil/dilayani** (atau start number sesi jika belum ada yang dipanggil).
    *   Saat memulai sesi baru dengan mencentang **"Lanjutkan dari nomor terakhir"**, sistem mengambil nilai `lastIssuedNumber` yang telah diperbarui tersebut sehingga kelanjutan nomor tiket bersifat presisi tanpa melompati sisa tiket waiting yang dibuang.
3.  **Broadcast Realtime:** Saat admin mengubah state loket (memanggil, melewati, menyelesaikan), controller memanggil `broadcastQueueStatusUpdate()` di `queue.sse.ts` untuk mendorong event SSE.
4.  **SSE Endpoint:** Frontend layar TV (`/antrean`) membuka koneksi `EventSource` ke `GET /api/queue/stream`. Hono menggunakan streaming response untuk menjaga koneksi tetap hidup dan mendorong payload state terbaru (`data: {...}`).
5.  **Audio Context Chime & TTS:** Bunyi bel "Ting-Tung" disintesis client-side menggunakan *AudioContext API* murni (tanpa file mp3 eksternal) lalu diteruskan ke *Web Speech API* browser untuk pemanggilan Text-To-Speech yang jernih.
6.  **Persistensi & Status Loket Operator:** Pilihan loket operator disimpan dalam client-side state sehingga me-refresh halaman tidak mereset pilihan loket. Terdapat tombol "Ganti Loket" dan fitur "Istirahat" (mengubah status menjadi istirahat di display). Pilihan loket ini dihapus secara otomatis dari localStorage saat operator melakukan logout.


---

## ⚠️ 6. Jebakan Umum & Troubleshooting (Gotchas)

1.  **Favicon Upload:** Favicon aplikasi (`app_icon`) ditangani secara lokal dan ditulis langsung ke filesystem kontainer (`/public/favicon.ico`) untuk mempercepat rendering browser. R2 Storage hanya digunakan untuk berkas dokumen siswa dan logo sekolah (`app_logo`).
2.  **State Loading Tombol Wizard:** Di `wizard.js`, saat mengirimkan AJAX, panggil `this.setButtonLoading('id-tombol', true)`. Pastikan untuk mengembalikan state tombol dengan `this.setButtonLoading('id-tombol', false)` di block `finally` agar tombol tidak macet dalam keadaan loading jika proses dihentikan atau modal muncul.
3.  **Accordion Sidebar Admin:** Sidebar admin menggunakan tag HTML `<details>` asli. Pastikan properti `open` dihitung dengan mencocokkan rute yang aktif menggunakan array rute (`currentPath.startsWith(...)`) agar navigasi tidak tertutup otomatis setelah halaman dimuat ulang.
4.  **API.request Auto-Prepend Path:** Pada berkas client-side Javascript, wrapper global `API.request(url, ...)` akan **secara otomatis menambahkan prefix `/api`** di depannya. Oleh karena itu, jangan menuliskan `/api/admin/settings` saat memanggil request, tulislah `/admin/settings` agar url request tidak berlipat ganda menjadi `/api/api/admin/settings` (yang mengakibatkan error 404).
5.  **WhatsApp Integration & Network Host:** Docker Container WhatsApp Gateway (GOWA atau HonoWA) berada di luar kontainer SPMB-WA. Pastikan Host URL yang disimpan di panel konfigurasi admin diakses secara benar via port internal docker network (misal: `http://gowa:3000`) atau via IP publik jika server hosting-nya terpisah.
6.  **Responsivitas Tabel Mobile:** Semua tabel di dashboard admin wajib dibungkus dalam div berkelas `.overflow-x-auto` agar jika tabel melebar secara horizontal di perangkat mobile, ia dapat di-scroll secara horizontal daripada memaksa melebarkan layar kontainer utama atau membuat tata letak pecah.
7.  **Standby Lobby Operator & Panggil Ulang:** Saat operator bersiap di loket, pastikan antarmuka melakukan refresh status standby loket secara asinkronus (SSE / API polling) tanpa merusak tombol panggil ulang. Pilihan loket harus bersih saat logout agar tidak bertabrakan dengan operator lain pada sesi berikutnya.
