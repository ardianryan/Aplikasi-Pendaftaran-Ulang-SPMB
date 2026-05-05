# SPMB-WA — Sistem Registrasi Ulang Siswa Baru

Aplikasi registrasi ulang (daftar ulang) peserta didik baru untuk **SMAN 1 Gedeg, Kabupaten Mojokerto**. Dibangun dengan pendekatan Mobile-First, Wizard Step-by-Step, dan standar aksesibilitas WCAG.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Backend | [Hono.js](https://hono.dev) (TypeScript) |
| Database | MongoDB (Mongoose ODM) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Frontend | Vanilla HTML/JS + Tailwind CSS (CDN) |
| PDF | Puppeteer (HTML → PDF) |
| Excel | ExcelJS |
| Auth | JWT (stateless) + Google OAuth |
| SSO | ScholarGate API |

## Prasyarat

- [Bun](https://bun.sh) >= 1.0
- MongoDB >= 6.0 (accessible)
- Cloudflare R2 bucket (atau S3-compatible storage)
- Google Cloud OAuth Client ID (untuk login operator via Google)
- ScholarGate SSO API access (untuk verifikasi guru/tendik)

## Quick Start

```bash
# 1. Clone & masuk ke direktori
cd spmb-wa

# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .env
# Edit .env sesuai konfigurasi Anda

# 4. Seed admin user & default settings
bun run seed

# 5. Jalankan development server
bun run dev
```

Server berjalan di `http://localhost:3000`

## Deployment with Docker (Recommended)

Untuk kemudahan instalasi, Anda bisa menggunakan Docker. Ini akan menyiapkan aplikasi, database MongoDB, dan antarmuka manajemen database (Mongo Express).

```bash
# 1. Jalankan script setup otomatis
./docker-setup.sh

# ATAU menggunakan make
make setup
```

**Detail Akses:**
- **App:** `http://localhost:3000`
- **Mongo Express:** `http://localhost:8081` (User: `root`, Pass: `password`)

```bash
docker-compose up -d
```

### Cara Paling Cepat (Pre-built Image)

Jika Anda hanya ingin menjalankan aplikasi tanpa menyentuh kode sumber, Anda bisa menggunakan image yang sudah jadi dari Docker Hub:

1.  **Siapkan file `.env`** (bisa copy dari [.env.example](.env.example)).
2.  **Jalankan perintah berikut**:
    ```bash
    docker run -d \
      --name spmb-wa \
      -p 3000:3000 \
      --env-file .env \
      ardianryan/registrasi-spmb:0.1.0-alpha
    ```
    *Catatan: Pastikan Anda sudah memiliki database MongoDB yang bisa diakses.*

## Deployment Options

### 1. Coolify (Self-Hosted PaaS) - **Direkomendasikan**
Aplikasi ini sangat cocok dideploy menggunakan **Coolify** karena mendukung Docker Compose dan menyertakan Chromium untuk Puppeteer.

1.  Buka dashboard Coolify Anda.
2.  Buat **New Project** -> **New Resource** -> **Public Repository**.
3.  Masukkan URL repository ini.
4.  Pilih **Docker Compose** sebagai build pack.
5.  Konfigurasi **Environment Variables** sesuai `.env.example`.
6.  Klik **Deploy**.

### 2. Vercel
Mendukung deployment cepat via Vercel (Bun Runtime).

1.  Hubungkan repository ke Vercel.
2.  Vercel akan mendeteksi `vercel.json` dan menggunakan Bun secara otomatis.
3.  Tambahkan **Environment Variables** di dashboard Vercel.
4.  **Catatan**: Fitur cetak PDF (Puppeteer) mungkin tidak berfungsi di Vercel Serverless tanpa konfigurasi tambahan (`puppeteer-core`). Disarankan menggunakan Coolify atau VPS jika fitur PDF sangat krusial.

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# MongoDB
MONGODB_URI=mongodb://user:pass@host:27017/dbname

# Cloudflare R2
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_BUCKET=your-bucket
R2_REGION=auto
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_PUBLIC_URL=https://static.domain.com
R2_PREFIX=uploads/smansage/akas/

# ScholarGate SSO
SSO_BASE_URL=https://scholargate.example.com
SSO_API_KEY=your-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## URL Routes

### Siswa (Mobile-First)

| URL | Halaman |
|-----|---------|
| `/` | Portal utama (landing page) |
| `/login` | Login siswa (NISN + Tanggal Lahir) |
| `/wizard` | Wizard registrasi (Step 1-5) |

### Admin (Desktop-First)

| URL | Halaman |
|-----|---------|
| `/admin/login` | Login admin (manual + Google) |
| `/admin/dashboard` | Dashboard statistik |
| `/admin/students` | Manajemen data siswa |
| `/admin/verify` | Daftar verifikasi (tabel) |
| `/admin/verify-detail?id=x` | Detail verifikasi siswa |
| `/admin/import` | Import data siswa dari Excel |
| `/admin/operators` | Manajemen operator + referral codes |
| `/admin/settings` | Pengaturan portal |

## API Endpoints

### Auth
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/api/auth/login` | Login siswa (NISN + tgl lahir) |
| POST | `/api/auth/admin/login` | Login admin (username + password) |
| POST | `/api/auth/google` | Login admin via Google OAuth |
| POST | `/api/auth/activate-operator` | Aktivasi operator (referral + Google) |
| GET | `/api/auth/google/client-id` | Get Google Client ID untuk frontend |

### Student (requires Student JWT)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/student/profile` | Data profil & wizard state |
| POST | `/api/student/confirm` | Konfirmasi data (Step 1→2) |
| GET | `/api/student/biodata` | Ambil biodata tersimpan |
| PUT | `/api/student/biodata` | Auto-save biodata (permissive) |
| POST | `/api/student/biodata/complete` | Validasi lengkap (Step 2→3) |
| POST | `/api/upload/:docType` | Upload dokumen ke R2 |
| DELETE | `/api/upload/:docType` | Hapus dokumen |
| GET | `/api/student/review` | Data lengkap untuk review |
| POST | `/api/student/submit` | Submit final (kunci form) |
| GET | `/api/student/pdf` | Download PDF buku induk |

### Admin (requires Admin JWT)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/admin/stats` | Statistik dashboard |
| GET | `/api/admin/students` | List siswa (paginated, filtered) |
| GET | `/api/admin/students/:id` | Detail siswa |
| GET | `/api/admin/students/:id/pdf` | Download PDF siswa |
| PUT | `/api/admin/students/:id/update` | Edit data siswa (admin) |
| PUT | `/api/admin/students/:id/verify` | Verifikasi/tolak |
| DELETE | `/api/admin/students/:id` | Hapus siswa |
| POST | `/api/admin/import` | Import Excel |
| GET | `/api/admin/import/template` | Download template Excel |
| GET | `/api/admin/export` | Export ke Excel |
| GET | `/api/admin/settings` | Ambil pengaturan |
| PUT | `/api/admin/settings` | Update pengaturan |
| POST | `/api/admin/settings/upload/:key` | Upload logo/icon/kop |
| POST | `/api/admin/sso/pull` | Tarik data guru/tendik dari SSO |
| GET | `/api/admin/operators` | List operator |
| POST | `/api/admin/operators` | Buat operator lokal |
| PUT | `/api/admin/operators/:id` | Update role/status |
| DELETE | `/api/admin/operators/:id` | Hapus operator |
| GET | `/api/admin/referrals` | List referral codes |
| POST | `/api/admin/referrals` | Buat referral baru |
| PUT | `/api/admin/referrals/:id/toggle` | Toggle aktif/nonaktif |
| DELETE | `/api/admin/referrals/:id` | Hapus referral |

### Public (no auth)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/settings/public` | Settings publik + R2 URL |
| GET | `/api/jalur-options` | Daftar jalur unik dari data siswa |
| GET | `/api/health` | Health check |

## Alur Registrasi Siswa

```
Login (NISN + Tgl Lahir via custom date picker)
  → Step 1: Konfirmasi Data (read-only)
  → Step 2: Isi Biodata Lengkap (72 field, accordion, auto-save 3s)
  → Step 3: Upload Dokumen (KK, Ijazah, Akta, Foto)
  → Step 4: Review & Pernyataan Integritas
  → Step 5: Selesai (form terkunci, status verifikasi, Download Buku Induk)
```

## Alur Admin

```
Login Admin (username/password ATAU Google OAuth)
  → Dashboard (statistik real-time)
  → Import siswa diterima (Excel, jalur bebas)
  → Data Siswa (tabel, search, filter jalur dinamis, hapus)
  → Verifikasi (tabel → detail: profil + dokumen + edit biodata + validasi per-dokumen)
  → Operator (buat lokal, tarik SSO, referral codes)
  → Pengaturan (identitas, branding, kop surat PDF, kontrol akses)
```

## Alur Operator Registration

```
1. Admin buat referral code (prefix, misal "U240512005", slot 1-99)
2. Admin kasih tahu guru: "Gunakan kode U240512005-3"
3. Guru buka /admin/login → klik "Masuk dengan Google"
4. Backend cek ScholarGate SSO → harus guru/tendik
5. Jika belum punya akun lokal → tampilkan form referral code
6. Guru masukkan "U240512005-3" → akun diaktifkan → login
```

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |

> Jalankan `bun run seed` untuk membuat admin default.

## Scripts

```bash
bun run dev       # Development server (hot reload)
bun run start     # Production server
bun run seed      # Seed admin user & default settings
bun run build     # Build untuk production
```

## Pengaturan Portal

Admin dapat mengubah melalui `/admin/settings`:

- **Nama Sekolah** — singkat & lengkap
- **Nama Sistem** — SPMB, PPDB, atau custom (diterapkan di seluruh app via `data-setting`)
- **Logo & Icon** — upload gambar ke R2
- **Buka/Tutup Registrasi** — toggle + custom pesan
- **Jadwal** — tanggal mulai & akhir, tahun pelajaran
- **Pengumuman** — banner text di portal
- **Kop Surat PDF** — 6 baris teks + 2 logo (kiri/kanan) + kota untuk tanda tangan

## Aksesibilitas (WCAG)

- Skip-to-content link
- `aria-label`, `aria-required`, `aria-describedby` pada form
- `role="progressbar"` dengan `aria-valuenow`
- `aria-current="step"` pada wizard navigation
- Focus management pada perpindahan step
- `aria-live="polite"` untuk error messages
- Touch target minimum 56px
- Color contrast ratio > 4.5:1
- `prefers-reduced-motion` support
- Custom date picker (bukan native) untuk kemudahan siswa

## License

Internal use — SMAN 1 Gedeg, Kabupaten Mojokerto.
