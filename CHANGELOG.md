# Changelog

Semua perubahan penting pada proyek **spmb-wa** akan didokumentasikan di file ini.

Format ini didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha] - 2026-05-05

### Added
- **Docker Environment**: Implementasi Dockerfile (Bun 1.1) dan docker-compose untuk kemudahan deployment.
- **Easy Setup Script**: Menambahkan `docker-setup.sh` untuk konfigurasi otomatis dan seeding database.
- **Makefile**: Shortcut perintah umum Docker (`make up`, `make down`, `make setup`).
- **Student Wizard**: Sistem registrasi 5 tahap (Konfirmasi, Biodata, Upload, Review, Selesai).
- **Admin Dashboard**: Statistik real-time, manajemen siswa, dan sistem verifikasi dokumen.
- **Integration**: Dukungan Cloudflare R2 untuk penyimpanan dokumen dan ScholarGate SSO untuk autentikasi operator.
- **PDF Generation**: Fitur cetak "Buku Induk" otomatis menggunakan Puppeteer.
- **Excel Support**: Import data siswa dan export hasil verifikasi ke format Excel.
- **Accessibility**: Implementasi standar WCAG (Aria-labels, focus management, dll).

### Changed
- Refaktor struktur folder untuk mengikuti pola Hono.js modern.
- Optimasi proses upload dokumen langsung ke R2.

### Security
- Implementasi JWT untuk autentikasi siswa dan admin.
- Proteksi route admin dengan middleware otorisasi.
- Hashing password admin menggunakan bcrypt.

---
*Initial Alpha Release for SMAN 1 Gedeg.*
