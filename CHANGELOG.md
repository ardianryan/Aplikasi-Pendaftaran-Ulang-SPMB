# Changelog

Semua perubahan penting pada proyek **SPMB-WA** akan didokumentasikan di file ini.

Format ini didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-21

### 🛡️ Security Audit & Hardening
- **DOM XSS & Quote-Breaking Fixes**: Membuat utilitas global `UI.escapeHTML(str)` di frontend untuk melakukan HTML Entity Encoding terhadap data sensitif. Fitur ini diterapkan di seluruh tabel data siswa, verifikasi antrean admin, formulir detail verifikasi, dan konfirmasi Buku Induk wizard. Nama siswa yang mengandung karakter petik satu seperti *Faishal Nafi'* kini dapat dirender dengan mulus tanpa memicu error sintaks JavaScript.
- **Sanitasi Input Backend Otomatis (Global Middleware)**: Mengimplementasikan middleware global `sanitizeBody` yang secara transparan meng-override `c.req.json()` di Hono. Middleware ini secara rekursif memindai payload input dan menghapus semua kunci (keys) yang diawali dengan tanda `$` atau mengandung titik `.` (mencegah NoSQL Injection pada MongoDB) serta membersihkan nilai string dari tag HTML berbahaya (mencegah Stored XSS).
- **Pengerasan HTTP Secure Headers & CSRF**: Mengaktifkan middleware Hono `secureHeaders` untuk melindungi dari Clickjacking (`X-Frame-Options: SAMEORIGIN`) dan MIME Sniffing (`X-Content-Type-Options: nosniff`). Mengaktifkan middleware Hono `csrf` untuk memblokir serangan Cross-Site Request Forgery di seluruh rute mutasi API.
- **CORS Same-Origin (Self-Origin) Terbatas**: Memperketat kebijakan CORS di index server secara dinamis agar hanya menerima request dari host aplikasi itu sendiri (`Self-Origin`), menolak eksploitasi lintas-asal oleh domain luar demi menyesuaikan instalasi Docker satu service.

### 🧹 Cleanup & Maintenance
- **Pembersihan Berkas Tidak Penting**: Menghapus direktori `scratch/` beserta seluruh script uji coba di dalamnya, serta menghapus file panduan kosong `API-ScholarGate.md`.
- **Konsistensi Konfigurasi Docker**: Menyesuaikan default fallback parameter `JWT_EXPIRES_IN` dari 24 jam menjadi **8 jam** di `docker-compose.yml` agar selaras dengan ketetapan durasi sesi kerja dinas operator di panduan developer.
- **Pembaruan Panduan Pengembang**: Memperbarui berkas `README.md`, `CLAUDE.md`, dan `Guide-for-ide.md` untuk memuat informasi arsitektur pengamanan baru same-origin CORS dan standardisasi sanitasi input.

---

## [0.2.0-alpha] - 2026-05-07

### 🚀 Major Refactor & Node.js Migration
- **Runtime Migration**: Migrasi runtime dari Bun ke **Node.js** untuk stabilitas dan ekosistem yang lebih luas.
- **Frontend Evolution (React/JSX)**: 
    - Transisi dari Vanilla HTML ke **React (Hono JSX)** untuk komponen UI yang lebih modular.
    - Pemisahan struktur folder frontend dan backend secara lebih bersih (*Clean Architecture*).
- **Redesigned Landing Page**: Tampilan Landing Page baru yang lebih modern, dinamis, dan informatif.
- **Centralized Master Jalur**:
    - Implementasi menu **"Master Jalur"** sebagai pusat pengaturan seluruh jalur pendaftaran (Single Source of Truth).
    - Integrasi otomatis nama jalur ke Landing Page, Linimasa Jadwal, dan Filter Data Siswa.
- **Dynamic Excel Integration**:
    - Template import Excel kini bersifat dinamis mengikuti daftar jalur yang aktif di Master Jalur.
    - Validasi kolom "Jalur" saat import untuk menjamin integritas data pendaftar.
- **UI/UX Polish**:
    - Overhaul total antarmuka **Manajemen Berkas Wajib** dengan desain kartu modern, toggle switch premium, dan sistem pemilihan jalur berbasis *Visual Chips*.
    - **Buku Induk Completion**: Ekspansi formulir registrasi dan verifikasi admin untuk mencakup seluruh **72 field historis** dari format Buku Induk lama, menjamin integritas data 100%.
    - Penambahan koleksi **Material Icons** yang lebih lengkap untuk kustomisasi Jalur, Jadwal, dan Berkas.
    - Perbaikan responsivitas sidebar admin dan toggle buttons.
    - Penambahan animasi loading state dan transisi antar halaman yang lebih halus.

### 🐞 Perbaikan (Fixes)
- Perbaikan issue jalur pendaftaran lama yang masih muncul di dropdown.
- Penanganan syntax error pada catch block di script manajemen siswa.
- Penyesuaian path resolution (import.meta.dirname) untuk kompatibilitas Node.js.

---

## [0.1.1-alpha] - 2026-05-05

### 🛠️ Improvements & Fixes
- **Security**: Pembaruan integrasi Google API Key untuk autentikasi admin.
- **SSO Integration**: Perbaikan issue 403 pada ScholarGate SSO dengan penambahan Referer header.
- **Documentation**: Pembaruan README dengan panduan instalasi Docker yang lebih lengkap.

---

## [0.1.0-alpha] - 2026-04-30

### 🚀 Initial Migration (Bun + Hono)
- **New Tech Stack**: Migrasi sistem awal dari PHP ke **Hono.js** menggunakan runtime **Bun**.
- **Features**:
    - Wizard registrasi siswa 5 tahap.
    - Panel administrasi dasar untuk verifikasi data.
    - Integrasi database MongoDB dan Cloudflare R2 untuk penyimpanan berkas.

---
*Aplikasi Registrasi Ulang Siswa Baru SMAN 1 Gedeg — Dari PHP ke Node.js Ecosystem.*
