# CLAUDE.md — Project Context for AI Assistants

## Project Overview

This is **SPMB-WA**, a student re-registration (daftar ulang) web application for SMAN 1 Gedeg, Mojokerto, Indonesia. It allows newly accepted high school students (age 14-15, from SMP) to complete their enrollment online.

## Architecture

- **Runtime:** Bun
- **Backend:** Hono.js (TypeScript)
- **Database:** MongoDB via Mongoose
- **File Storage:** Cloudflare R2 (S3-compatible SDK)
- **Frontend:** Vanilla HTML/JS with Tailwind CSS (CDN), no build step
- **Auth:** JWT (stateless, stored in localStorage + Authorization header)
- **Auth (Admin):** Local username/password OR Google OAuth (via ScholarGate SSO + referral code)
- **PDF:** Puppeteer (HTML template → PDF)
- **Excel:** ExcelJS for import/export
- **SSO:** ScholarGate API for guru/tendik verification

## Key Design Decisions

1. **No frontend framework** — Vanilla JS with a custom Wizard state machine. Target users are 14-15 year old students on mobile phones; minimal JS bundle is critical.

2. **Pretty URLs** — Server-side rewrite in `src/index.ts` maps `/login` → `public/login.html`. No `.html` extensions in links.

3. **Mobile-First for students, Desktop-First for admin** — Student pages use responsive wizard with mobile progress bar. Admin pages use fixed sidebar layout.

4. **Auto-save on biodata** — Step 2 (biodata form) auto-saves every 3 seconds on input change via debounced PUT to `/api/student/biodata`.

5. **Form locking** — After final submit (`isSubmitted: true`), all write endpoints are blocked by `lockedGuard` middleware.

6. **Configurable branding** — School name, app name (SPMB/PPDB), logo, icon, kop surat are all stored in MongoDB `settings` collection and served via `/api/settings/public`.

7. **Dynamic jalur/tahap** — Jalur options are not hardcoded; they come from actual imported student data (`Student.distinct("jalur")`).

8. **Role-based access** — Operators can only see Dashboard, Data Siswa, Verifikasi. Admin sees all menus. Enforced by `role-guard.js`.

9. **Operator registration** — Requires ScholarGate SSO verification (guru/tendik) + referral code from admin. Flow: Google login → SSO check → referral code → activate.

10. **Date inputs** — Custom DD / Bulan dropdown / YYYY picker (not native `<input type="date">`) for better mobile UX with Indonesian students.

## Directory Structure

```
src/
├── index.ts              # App entry, middleware, static serving, pretty URLs
├── config/
│   ├── database.ts       # Mongoose connection
│   ├── r2.ts             # S3Client singleton for Cloudflare R2
│   └── constants.ts      # All enums, options, upload config
├── models/
│   ├── Student.ts        # 72-field schema (nested subdocuments)
│   ├── Admin.ts          # Admin with bcrypt + Google OAuth fields
│   ├── Setting.ts        # Key-value settings + DEFAULT_SETTINGS array
│   └── ReferralCode.ts   # Operator registration codes (prefix + suffix slots)
├── routes/
│   ├── index.ts          # Route aggregator + public settings + jalur-options
│   ├── auth.routes.ts    # Login, Google OAuth, activate-operator
│   ├── student.routes.ts
│   ├── upload.routes.ts
│   └── admin.routes.ts   # CRUD + SSO pull + referrals + operators
├── controllers/
│   ├── auth.controller.ts    # Student login, admin login, Google OAuth, activate
│   ├── student.controller.ts # Wizard steps, biodata, submit, PDF
│   ├── upload.controller.ts  # File upload to R2
│   └── admin.controller.ts   # Stats, students, verify, import, export, settings, operators, referrals
├── middleware/
│   ├── auth.middleware.ts    # studentAuth, adminAuth (JWT verification)
│   ├── locked.middleware.ts  # Blocks writes if isSubmitted=true
│   └── validate.middleware.ts # Generic Zod validator
├── validators/
│   ├── auth.schema.ts        # Login validation
│   └── biodata.schema.ts     # Auto-save (permissive) + complete (strict) schemas
├── services/
│   ├── jwt.service.ts    # sign/verify tokens
│   ├── r2.service.ts     # upload/delete/getPublicUrl
│   ├── sso.service.ts    # ScholarGate API + Google token verification
│   ├── excel.service.ts  # import template, parse, export
│   └── pdf.service.ts    # Puppeteer HTML→PDF with dynamic kop from settings
├── utils/
│   ├── response.ts       # Standardized { success, data, message } helpers
│   └── date.ts           # Indonesian date formatting + Excel date parsing
├── scripts/
│   └── seed-admin.ts     # Seeds admin/admin123 + default settings
└── templates/pdf/
    └── buku-induk.html   # PDF template with {{placeholder}} + {{#conditional}} syntax
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
bunx tsc --noEmit

# JS syntax check
node --check public/js/wizard.js

# Run server
bun run dev

# Seed test data
bun run seed
```

## Important Notes

- The `old-spmb/` and `stitch_registrasi_ulang_sman_1_gedeg/` directories are reference materials only, not part of the application.
- MongoDB connection string in `.env` points to a specific internal server (10.1.0.3). Ensure network access.
- Puppeteer requires Chrome/Chromium. On servers without a display, use `--no-sandbox` flag (already configured).
- The app uses `import.meta.dir` (Bun-specific) in `pdf.service.ts` for template path resolution.
- R2 public URL is exposed to frontend via `/api/settings/public` as `r2_public_url` for document preview.
- Jalur/tahap options are dynamic from `GET /api/jalur-options` (not hardcoded).
- Google OAuth uses GIS Token Client (popup mode) — requires only "Authorized JavaScript Origins" in Google Console, not Redirect URIs.
- SSO_BASE_URL and SSO_API_KEY must be set for operator Google login to work (ScholarGate verification).
