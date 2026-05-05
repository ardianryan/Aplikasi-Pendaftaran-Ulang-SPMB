# Changelog

Semua perubahan penting pada proyek **SPMB-WA** akan didokumentasikan di file ini.

Format ini didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha] - 2026-05-05

### 🚀 Fitur Baru (Features)
- **Multi-Platform Deployment**:
    - Mendukung deployment via **Docker** & **Docker Compose** untuk kemudahan instalasi di server mandiri (VPS).
    - Konfigurasi **Vercel** (`vercel.json`) siap pakai untuk deployment serverless menggunakan Bun runtime.
    - Panduan integrasi untuk **Coolify** (Self-hosted PaaS).
- **Otomatisasi CI/CD**:
    - Implementasi **GitHub Actions** untuk build dan push image Docker ke Docker Hub secara otomatis saat rilis tag baru.
- **Sistem Registrasi Siswa**:
    - Wizard 5 tahap yang intuitif: Konfirmasi Data, Biodata Lengkap, Unggah Dokumen, Review Akhir, dan Selesai.
    - Sistem simpan otomatis (*auto-save*) pada tahap pengisian biodata.
- **Panel Administrasi**:
    - Dashboard statistik pendaftar secara real-time.
    - Manajemen data siswa lengkap dengan filter jalur pendaftaran yang dinamis.
    - Sistem verifikasi dokumen per-item oleh admin/operator.
- **Integrasi Pihak Ketiga**:
    - Penyimpanan dokumen menggunakan Cloudflare R2 (S3 compatible).
    - Autentikasi operator terintegrasi dengan **ScholarGate SSO**.

### 🛠️ Peningkatan (Improvements)
- **Optimasi Performa**: Migrasi ke **Bun Runtime** untuk eksekusi server yang lebih cepat dan penggunaan memori yang efisien.
- **Generator Dokumen**: Pembuatan file PDF "Buku Induk" secara otomatis menggunakan Puppeteer (HTML to PDF).
- **Manajemen Data**: Fitur Import dan Export data siswa menggunakan format Excel (.xlsx).
- **Aksesibilitas**: Mengikuti standar WCAG untuk kenyamanan penggunaan di perangkat mobile dan desktop.

### 🔒 Keamanan (Security)
- Autentikasi berbasis **JWT** (Stateless) untuk siswa dan admin.
- Proteksi password menggunakan enkripsi **bcrypt**.
- Implementasi middleware otorisasi untuk rute-rute sensitif admin.
- Konfigurasi `.gitignore` dan `.dockerignore` yang ketat untuk mencegah kebocoran file kredensial (`.env`).

### 📦 Tools & Scripts
- Menambahkan `docker-setup.sh` untuk instalasi satu langkah bagi pengguna baru.
- Menambahkan `Makefile` untuk mempermudah operasional (up, down, logs, setup, release).
- Menambahkan `release.sh` untuk manajemen versi dan rilis Docker Hub.

---
*Initial Alpha Release — Sistem Registrasi Ulang Siswa Baru SMAN 1 Gedeg.*
