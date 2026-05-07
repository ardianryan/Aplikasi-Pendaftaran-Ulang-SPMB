# Changelog

Semua perubahan penting pada proyek **SPMB-WA** akan didokumentasikan di file ini.

Format ini didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
