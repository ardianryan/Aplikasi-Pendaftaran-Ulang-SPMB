# 🎓 SPMB-WA — Sistem Registrasi Ulang Siswa Baru

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fardianryan%2FAplikasi-Pendaftaran-Ulang-SPMB">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
  &nbsp;&nbsp;
  <a href="https://railway.app/template/deploy?referrerId=ardianryan&template=https%3A%2F%2Fgithub.com%2Fardianryan%2FAplikasi-Pendaftaran-Ulang-SPMB">
    <img src="https://railway.app/button.svg" alt="Deploy on Railway" />
  </a>
  &nbsp;&nbsp;
  <a href="https://render.com/deploy?repo=https://github.com/ardianryan/Aplikasi-Pendaftaran-Ulang-SPMB">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
  </a>
</p>

---

Aplikasi registrasi ulang (daftar ulang) peserta didik baru untuk **SMAN 1 Gedeg, Kabupaten Mojokerto**. Dibangun dengan pendekatan **Mobile-First**, **Wizard Step-by-Step**, dan standar aksesibilitas **WCAG**.

## 🌟 Fitur Unggulan Terbaru

*   🔑 **Durasi Sesi Kerja Operator 8 Jam:** Batas kedaluwarsa token JWT diatur selama 8 jam secara default agar operator/panitia PPDB dapat bekerja seharian dengan nyaman tanpa perlu login ulang berkali-kali.
*   🛡️ **Hak Akses & Role Peran Operator Dinamis:** Super Admin dapat mengkonfigurasi hak akses khusus operator secara granular (verifikasi dokumen, edit data siswa, hapus data, integrasi WA blast, manajemen antrean) secara dinamis langsung dari Dashboard Pengaturan.
*   📡 **Sistem Antrean Digital Cerdas:** Dilengkapi layar publik realtime (SSE), pemanggilan suara (TTS), integrasi bel *AudioContext*, manajemen status loket ("Istirahat"), auto-cleanup sisa antrean waiting di database, serta pemanggilan bertahap sequential dari nomor terakhir.
*   📱 **Responsivitas Maksimal & Horizontal Scroll:** Semua halaman siswa bebas dari sidebar pada mode mobile, dan semua tabel admin dilengkapi pembungkus responsive scroll agar antarmuka tidak rusak di layar kecil.

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Runtime** | [Node.js](https://nodejs.org) 🚀 |
| **Backend** | [Hono.js](https://hono.dev) (TypeScript) ⚡ |
| **Database** | MongoDB (Mongoose ODM) 🍃 |
| **Storage** | Cloudflare R2 (S3-compatible) ☁️ |
| **Frontend** | React (Hono JSX) + Tailwind CSS 🎨 |
| **PDF Gen** | Puppeteer (HTML → PDF) 📄 |
| **Auth** | JWT + Google OAuth 🔑 |
| **Realtime** | Server-Sent Events (SSE) 📡 |

## 📱 Integrasi WhatsApp Gateway

SPMB-WA dilengkapi dengan modul integrasi gateway WhatsApp pihak ketiga yang canggih menggunakan **Adapter Pattern** untuk komunikasi asinkronus ke calon siswa. Modul ini digunakan untuk pengiriman pesan otomatis (notifikasi verifikasi berkas) maupun massal (blast reminder pendaftaran).

### 🔗 Gateway yang Didukung:
1. **GOWA (Go-WhatsApp)** — [aldinokemal/go-whatsapp-web-multidevice](https://github.com/aldinokemal/go-whatsapp-web-multidevice) 🚀 *(Default & Direkomendasikan)*
   * Berbasis **Go binary** yang sangat ringan, stabil, dan menggunakan memori sangat kecil.
   * Mendukung Basic Auth & scoping multi-device (`X-Device-Id`).
2. **HonoWA (Hono-WhatsApp)** — [elianhardyy/hono-wa-web-multidevice](https://github.com/elianhardyy/hono-wa-web-multidevice) ⚡
   * Berbasis **Hono.js + Puppeteer** dengan dukungan otentikasi API Key token (`X-API-Key`) dan multi-session yang handal.

### ⚙️ Fitur WhatsApp Admin:
* **Manajemen Konfigurasi:** Pengaturan konektivitas (Endpoint, Auth Token/Basic Auth, Device ID, Master Switch) disimpan aman di database (MongoDB), bukan berkas `.env`.
* **Editor Template Pesan:** Kustomisasi pesan notifikasi dengan variabel pintar otomatis: `{{nama}}`, `{{nisn}}`, `{{jalur}}`, `{{sekolah}}`, `{{tahun}}`, dan `{{url}}`.
* **Antrean Massal (Blast Engine):** Kirim pesan massal dengan penundaan otomatis (delay minimal 5 detik) untuk mencegah blokir/ban nomor.
* **Log Riwayat Komunikasi:** Paging log pengiriman lengkap dengan retensi cleanup otomatis (7, 14, atau 30 hari).
* **Auto-Notification & Quick Actions:** Notifikasi otomatis ketika verifikasi berkas disetujui/ditolak, serta tombol manual "Kirim WA" langsung di dashboard detail siswa.

## 📺 Sistem Antrean Digital (Public TV Display)

Dilengkapi dengan modul display antrean mandiri (route `/antrean`) yang dirancang khusus untuk ditampilkan pada Smart TV sekolah saat masa daftar ulang tatap muka.

### ✨ Fitur Antrean Utama:
* **Real-time Updates (SSE):** Menggunakan Server-Sent Events untuk sinkronisasi seketika (pemanggilan nomor, update status loket) tanpa membebani server, dilengkapi fallback polling otomatis jika koneksi terputus.
* **Premium & Aesthetic UI & Mobile-Ready:** Antarmuka responsif dengan animasi transisi halus, mendukung **Light Mode / Dark Mode** secara dinamis, desain berbasis tata letak split-screen proporsional, serta tabel ramah mobile dengan fitur horizontal scroll.
* **Text-to-Speech & Chime:** Pemanggilan otomatis menggunakan *Web Speech API* dalam Bahasa Indonesia yang jernih, didahului dengan bunyi bel (chime) "Ting-Tung" hasil sintesis *AudioContext* langsung di browser.
* **Pengumuman Split-Screen:** Layar terbagi cerdas yang dapat menayangkan teks pengumuman interaktif (HTML/Quill Editor) atau pemutaran video (YouTube iframe) secara berdampingan dengan panggilan nomor antrean.
* **Manajemen Loket & Sesi Batch Pintar:** Petugas dapat memanggil antrean, melewati (`skip`), memanggil ulang (`recall`), serta mengatur status istirahat loket. Sesi dikelola secara batch, di mana sisa tiket waiting otomatis **dibersihkan (cleanup)** dari DB saat sesi berakhir, dan sesi baru dengan opsi *Lanjutkan* berjalan secara sequential mulus dari nomor terpanggil terakhir.

## 🚀 Quick Start (Development)

1.  **Clone & Masuk Direktori**
    ```bash
    git clone https://github.com/ardianryan/Aplikasi-Pendaftaran-Ulang-SPMB.git
    cd spmb-wa
    ```
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **Setup Environment**
    ```bash
    cp .env.example .env
    # Edit .env dengan kredensial Anda
    ```
4.  **Seed Data & Run**
    ```bash
    npm run seed
    npm run dev
    ```

## 🐳 Deployment with Docker (Recommended)

Kami menyediakan berbagai cara untuk menjalankan aplikasi di lingkungan Docker. Pastikan Anda telah menyalin dan menyesuaikan file `.env` sebelum memulai.

### ⚙️ Persiapan Environment
Sebelum menjalankan aplikasi, pastikan file `.env` sudah dikonfigurasi:
```bash
cp .env.example .env
# Edit .env dan sesuaikan nilainya
```

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `APP_URL` | URL utama aplikasi (untuk SSO Referer) | `http://localhost:3000` |
| `JWT_SECRET` | Kunci rahasia untuk enkripsi token | - |
| `MONGODB_URI` | URL koneksi ke database MongoDB | - |

---

### 🌐 Pengaturan Integrasi & Konektivitas (Dashboard Admin)
Untuk meningkatkan fleksibilitas dan keamanan, konfigurasi untuk **Cloudflare R2 Storage**, **ScholarGate SSO**, dan **Google OAuth** kini dikelola **sepenuhnya secara dinamis** melalui **Dashboard Pengaturan Admin (Integrasi & Konektivitas)**. 

Anda tidak perlu menyunting berkas `.env` atau memulai ulang server untuk mengubah integrasi ini. Cukup buka dashboard admin di `/admin`, masuk ke **Pengaturan**, dan Anda akan menemukan panel konfigurasi berikut:

1.  **Penyimpanan Cloudflare R2 (S3-Compatible):**
    *   Mengatur `Endpoint`, `Bucket`, `Region`, `Access Key ID`, `Secret Access Key`, `Path Prefix`, dan `Public URL Base`.
    *   Mendukung tombol **Uji Koneksi R2** untuk menguji coba aksi upload/delete secara langsung di UI.
    *   **Fallback Lokal Otomatis:** Apabila koneksi R2 bermasalah atau belum dikonfigurasi, sistem akan secara otomatis menyimpan dokumen unggahan siswa ke penyimpanan lokal server (`/public/uploads/`) dengan prefiks `local://` secara transparan agar pendaftaran tidak terganggu!
2.  **SSO ScholarGate (Integrasi Operator):**
    *   Mengatur `Base URL` dan `API Key` untuk sinkronisasi data operator PPDB.
    *   Mendukung tombol **Uji Koneksi SSO** untuk memastikan kunci API dan URL SSO terhubung dengan benar.
3.  **Google OAuth (Login Operator):**
    *   Mengatur `Google Client ID` (berakhiran `.apps.googleusercontent.com`).
    *   Mendukung tombol **Uji Google OAuth** untuk memvalidasi format Client ID dan konektivitas keluar ke Google Discovery API.

---

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
  ardianryan/registrasi-spmb:latest
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
Setelah instalasi selesai dan database di-seed (`npm run seed`), Anda dapat masuk ke dashboard admin dengan kredensial berikut:

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
| **Vercel** | ✅ Compatible | Klik **Import** di dashboard Vercel (Node.js Runtime). |
| **Railway** | ✅ Compatible | Gunakan `Dockerfile` yang tersedia. |

## 📚 Dokumentasi Developer & Panduan AI

Untuk membantu pengembangan proyek secara berkelanjutan, silakan merujuk pada berkas panduan teknis berikut:
*   [CLAUDE.md](file:///Users/ardianryan/spmb-wa/CLAUDE.md) — Panduan konteks proyek, perintah CLI penting, struktur database, serta alur validasi dan tugas pengembangan umum untuk AI Coding Assistant.
*   [Guide-for-ide.md](file:///Users/ardianryan/spmb-wa/Guide-for-ide.md) — Panduan komprehensif bagi developer manusia maupun AI mengenai peta navigasi direktori, batasan arsitektur Hono Server-Side JSX, logika perlindungan form (`lockedGuard`), integrasi WhatsApp, dan sistem antrean digital.

---

## 📁 Struktur Folder Utama

- `src/backend/` — Server-side logic (Hono Routes, Controllers, Models).
- `src/frontend/` — UI Components & Pages (React / Hono JSX).
- `public/` — Client-side assets (Images, Global JS, Styles).
- `docker-setup.sh` — Script instalasi mandiri.

---

## 📜 Changelog
Detail perubahan setiap versi dapat dilihat di [CHANGELOG.md](CHANGELOG.md).

## 📄 License
Internal use — **SMAN 1 Gedeg, Kabupaten Mojokerto.**
