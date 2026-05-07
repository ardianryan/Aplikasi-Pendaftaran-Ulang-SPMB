# 🎓 SPMB-WA — Sistem Registrasi Ulang Siswa Baru

<p align="center">
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" />
  <img src="https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

Aplikasi registrasi ulang (daftar ulang) peserta didik baru untuk **SMAN 1 Gedeg, Kabupaten Mojokerto**. Dibangun dengan pendekatan **Mobile-First**, **Wizard Step-by-Step**, dan standar aksesibilitas **WCAG**.

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Runtime** | [Bun](https://bun.sh) 🚀 |
| **Backend** | [Hono.js](https://hono.dev) (TypeScript) ⚡ |
| **Database** | MongoDB (Mongoose ODM) 🍃 |
| **Storage** | Cloudflare R2 (S3-compatible) ☁️ |
| **Frontend** | Vanilla HTML/JS + Tailwind CSS (CDN) 🎨 |
| **PDF Gen** | Puppeteer (HTML → PDF) 📄 |
| **Auth** | JWT + Google OAuth 🔑 |

## 🚀 Quick Start (Development)

1.  **Clone & Masuk Direktori**
    ```bash
    git clone https://github.com/ardianryan/Aplikasi-Pendaftaran-Ulang-SPMB.git
    cd spmb-wa
    ```
2.  **Install Dependencies**
    ```bash
    bun install
    ```
3.  **Setup Environment**
    ```bash
    cp .env.example .env
    # Edit .env dengan kredensial Anda
    ```
4.  **Seed Data & Run**
    ```bash
    bun run seed
    bun run dev
    ```

## 🐳 Deployment with Docker (Recommended)

Kami menyediakan berbagai cara untuk menjalankan aplikasi di lingkungan Docker. Pastikan Anda telah menyalin dan menyesuaikan file `.env` sebelum memulai.

### ⚙️ Persiapan Environment
Sebelum menjalankan Docker, pastikan file `.env` sudah ada:
```bash
cp .env.example .env
# Edit .env dan sesuaikan nilainya (terutama JWT_SECRET dan Cloudflare R2)
```

### A. Docker Compose (Paling Direkomendasikan)
Cara ini akan menjalankan aplikasi beserta database MongoDB secara otomatis:
```bash
docker-compose up -d
```

### B. Cara Cepat (Pre-built Image)
Gunakan image yang sudah jadi dari Docker Hub:
```bash
docker run -d \
  --name spmb-wa \
  -p 3000:3000 \
  --env-file .env \
  ardianryan/registrasi-spmb:0.1.1-alpha
```

### C. Otomatisasi dengan Script Setup
Jalankan satu perintah untuk menyiapkan seluruh stack (App + MongoDB):
```bash
chmod +x docker-setup.sh
./docker-setup.sh
# ATAU
make setup
```

## 🔐 Default Admin Login
Setelah instalasi selesai dan database di-seed (`bun run seed`), Anda dapat masuk ke dashboard admin dengan kredensial berikut:

| Field | Value |
|-------|-------|
| **URL Admin** | `http://localhost:3000/admin` |
| **Username** | `admin` |
| **Password** | `admin123` |

> [!WARNING]
> Segera ganti password admin Anda setelah login pertama kali untuk keamanan.

## 🌍 Cloud Deployment Options

| Platform | Status | Cara |
|----------|--------|------|
| **Coolify** | ✅ Recommended | Hubungkan repo & pilih build pack **Docker Compose**. |
| **Vercel** | ✅ Compatible | Klik **Import** di dashboard Vercel (Bun Runtime). |
| **Railway** | ✅ Compatible | Gunakan `Dockerfile` yang tersedia. |

## 📁 Struktur Folder Utama

- `src/` — Logika backend (Hono routes, controllers, models).
- `public/` — Frontend (Static HTML, JS, CSS).
- `.github/` — Otomatisasi CI/CD.
- `docker-setup.sh` — Script instalasi mandiri.

---

## 📜 Changelog
Detail perubahan setiap versi dapat dilihat di [CHANGELOG.md](CHANGELOG.md).

## 📄 License
Internal use — **SMAN 1 Gedeg, Kabupaten Mojokerto.**
