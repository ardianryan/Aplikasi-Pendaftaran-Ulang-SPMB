# CLAUDE.md — Project Context for AI Assistants

## Project Overview

This is **SPMB-WA**, a student re-registration (daftar ulang) web application for SMAN 1 Gedeg, Mojokerto, Indonesia. It allows newly accepted high school students (age 14-15, from SMP) to complete their enrollment online.

## Architecture

- **Runtime:** Node.js (via `tsx` for TypeScript execution)
- **Backend:** Hono.js (TypeScript)
- **Database:** MongoDB via Mongoose
- **File Storage:** Cloudflare R2 (S3-compatible SDK)
- **Frontend:** React (Hono JSX) + Tailwind CSS
- **Routing:** Hono server-side routing for both API and Pages
- **Auth:** JWT (stateless, stored in localStorage + Authorization header)
- **Auth (Admin):** Local username/password OR Google OAuth (via ScholarGate SSO + referral code)
- **PDF:** Puppeteer (HTML template → PDF)
- **Excel:** ExcelJS for import/export
- **SSO:** ScholarGate API for guru/tendik verification

## Key Design Decisions

1. **Server-Side JSX (Hono JSX)** — UI is built using React-style components but rendered on the server for speed and SEO. Standard React-like syntax is used without a complex build step (via `tsx`).

2. **Unified Routing** — `src/index.tsx` handles all routes. Page components are imported from `src/frontend/pages` and rendered using a `renderPage` helper that injects global settings.

3. **Mobile-First for students, Desktop-First for admin** — Student pages use responsive wizard with mobile progress bar. Admin pages use fixed sidebar layout.

4. **Auto-save on biodata** — Step 2 (biodata form) auto-saves every 3 seconds on input change via debounced PUT to `/api/student/biodata`.

5. **Form locking** — After final submit (`isSubmitted: true`), all write endpoints are blocked by `lockedGuard` middleware.

6. **Configurable branding** — School name, app name, logo, favicon, and kop surat are stored in MongoDB and served via context to all pages. Favicon is managed locally at `public/favicon.ico`.

7. **Dynamic jalur/tahap** — Landing page jalurs and required files are fully configurable via Admin Dashboard (stored as JSON in settings).

8. **Role-based access** — Operators have restricted views; Admins see all. Enforced via `adminAuth` middleware and `role-guard.js`.

## Directory Structure

```
src/
├── index.tsx             # Main entry (Hono App + Page Routes)
├── backend/              # Server-side logic
│   ├── config/           # Database, R2, constants
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route aggregators
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth guards, lock guards
│   ├── validators/       # Zod schemas
│   ├── services/         # PDF, Excel, R2, JWT, SSO
│   ├── utils/            # Helpers (response, date, settings)
│   └── scripts/          # Database seeding
└── frontend/             # UI Components (JSX)
    ├── layouts/          # Base templates (Layout, AdminLayout)
    └── pages/            # Page components (Landing, Wizard, etc.)

public/                   # Static assets
├── js/                   # Global JS (api.js, ui.js) and page logic (wizard.js)
├── css/                  # Custom styles
└── favicon.ico           # Dynamic favicon target
```


## Database Schema

### `students` collection
- Unique index on `nisn` (10-digit string)
- Nested subdocuments: `biodata`, `alamat`, `kesehatan`, `pendidikan`, `ayah`, `ibu`, `wali`, `kegemaran`, `dokumen`, `verifikasi`
- `wizardStep` (1-5) tracks progress
- `isSubmitted` boolean locks the record
- `jalur` is free-text (from Excel import, not enum)
- Text index on `namaPreRegister` for search

### `admins` collection
- `username` (unique, lowercase)
- `passwordHash` (bcrypt, salted in pre-save hook)
- `role`: "admin" | "operator"
- `authMethod`: "local" | "google"
- `googleEmail`, `googleAvatar`, `ssoId`, `nip` (for SSO users)
- `isActive` boolean

### `referral_codes` collection
- `prefix` (unique, uppercase) — e.g., "U240512005"
- `maxSlots` (1-99)
- `usedSlots[]` — array of { suffix, usedBy, usedAt, googleEmail }
- `isActive` boolean

### `settings` collection
- `key` (unique string)
- `value` (Mixed type)
- Includes: school identity, app branding, registration control, schedule, kop surat (6 lines + 2 logos + city)
- Seeded with DEFAULT_SETTINGS on first access

## API Response Format

All endpoints return:
```json
{
  "success": true|false,
  "message": "optional message",
  "data": { ... },
  "errors": [ { "field": "...", "message": "..." } ],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

## File Upload Pattern

Files go to R2 with key: `{R2_PREFIX}{nisn}/{docType}.{ext}`
- docTypes: `kartuKeluarga`, `ijazahSkl`, `aktaKelahiran`, `foto4x6`
- Max 5MB, allowed: PDF/JPG/PNG (foto: JPG/PNG only)
- Settings uploads (logo/icon/kop): `{R2_PREFIX}settings/{key}.{ext}`, max 2MB

## Frontend Conventions

- Tailwind CSS via CDN with custom config (Material Design 3 color tokens)
- Icons: Google Material Symbols Outlined
- Fonts: Lexend (display), Public Sans (body)
- All interactive elements: `min-h-[56px]` for touch targets
- `focus:ring-2 focus:ring-primary` on all inputs
- Toast notifications via dynamic DOM insertion
- `settings-loader.js` on every page for dynamic branding (`data-setting="key"` attributes)
- `role-guard.js` on admin pages for menu visibility control
- Date pickers: custom DD + Bulan dropdown + YYYY (not native date input)

## Common Tasks

### Add a new setting
1. Add to `DEFAULT_SETTINGS` array in `src/models/Setting.ts`
2. Add key to `publicKeys` array in `src/routes/index.ts` (if public-facing)
3. Add UI in `public/admin/settings.html`
4. Add to `TEXT_SETTINGS` array in settings.html script

### Add a new form field to biodata
1. Add to Student schema in `src/models/Student.ts`
2. Add HTML input in `public/wizard.html` (inside appropriate accordion)
3. Add get/set in `public/js/wizard.js` (`populateBiodataForm` + `collectBiodataForm`)
4. Add to verify-detail.html `renderBiodata()` function
5. Add to PDF template in `src/templates/pdf/buku-induk.html`
6. Add placeholder replacement in `src/services/pdf.service.ts`

### Add a new admin page
1. Create `public/admin/newpage.html` (copy sidebar from existing page)
2. Include `settings-loader.js` and `role-guard.js`
3. Add sidebar link in all other admin pages
4. Pretty URL works automatically (no backend changes needed)

### Biodata validation
- Auto-save (`PUT /biodata`): uses `biodataUpdateSchema` — VERY permissive (`z.record(z.any())`), accepts anything
- Complete (`POST /biodata/complete`): uses `biodataCompleteSchema` — strict, checks required fields with `requiredSelect()`, `requiredString()`, `requiredNumber()` helpers
- Locked fields (from import): `namaLengkap`, `tanggalLahir`, `asalSekolah` — readonly in frontend, skipped in backend save

## Testing

No test framework is currently set up. To verify:
```bash
# Type check
npx tsc --noEmit

# JS syntax check
node --check public/js/wizard.js

# Run server
npm run dev

# Seed test data
npm run seed
```

## Important Notes

- The `old-spmb/` and `stitch_registrasi_ulang_sman_1_gedeg/` directories are reference materials only, not part of the application.
- MongoDB connection string in `.env` points to a specific internal server (10.1.0.3). Ensure network access.
- Puppeteer requires Chrome/Chromium. On servers without a display, use `--no-sandbox` flag (already configured).
- The app uses `import.meta.dirname` (Node.js 20.11+) or `fileURLToPath(import.meta.url)` in `pdf.service.ts` for template path resolution.
- R2 public URL is exposed to frontend via `/api/settings/public` as `r2_public_url` for document preview.
- Jalur/tahap options are dynamic from `GET /api/jalur-options` (not hardcoded).
- Google OAuth uses GIS Token Client (popup mode) — requires only "Authorized JavaScript Origins" in Google Console, not Redirect URIs.
- SSO_BASE_URL and SSO_API_KEY must be set for operator Google login to work (ScholarGate verification).
