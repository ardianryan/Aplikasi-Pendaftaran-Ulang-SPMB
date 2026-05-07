/**
 * PDF Service
 * Generates Buku Induk PDF using Puppeteer (HTML → PDF)
 * Template replicates the old-spmb/cetak/index.html layout
 * Kop surat and school info are loaded dynamically from settings
 */

import puppeteer from "puppeteer";
import { formatTanggalIndonesia, formatTempatTanggalLahir } from "../utils/date";
import { Setting } from "../models/Setting";
import type { IStudent } from "../models/Student";
import path from "path";
import fs from "fs";

// ============================================
// Generate PDF from Student Data
// ============================================

/**
 * Generate a PDF document (Buku Induk format) for a student
 * @param student - Complete student data from MongoDB
 * @returns PDF as Buffer
 */
export async function generatePdf(student: any): Promise<Buffer> {
  // Load settings for kop surat
  const settings = await loadPdfSettings();

  // Load HTML template
  const templatePath = path.join(
    import.meta.dirname,
    "../templates/pdf/buku-induk.html"
  );

  let html: string;
  try {
    html = fs.readFileSync(templatePath, "utf-8");
  } catch {
    // Fallback: generate HTML inline if template file not found
    html = generateHtmlTemplate(student);
  }

  // Replace placeholders with student data + settings
  html = populateTemplate(html, student, settings);

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "2cm",
        right: "1.75cm",
        bottom: "2.55cm",
        left: "2.75cm",
      },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ============================================
// Load Settings for PDF
// ============================================

async function loadPdfSettings(): Promise<Record<string, string>> {
  const settingsDoc = await Setting.find({
    key: {
      $in: [
        "kop_line1", "kop_line2", "kop_line3", "kop_line4", "kop_line5", "kop_line6",
        "kop_logo_left", "kop_logo_right", "kop_city", "school_year",
      ],
    },
  }).lean();

  const settings: Record<string, string> = {};
  for (const s of settingsDoc) {
    settings[s.key] = String(s.value || "");
  }

  // Defaults
  return {
    kop_line1: settings.kop_line1 || "PEMERINTAH PROVINSI JAWA TIMUR",
    kop_line2: settings.kop_line2 || "DINAS PENDIDIKAN",
    kop_line3: settings.kop_line3 || "SEKOLAH MENENGAH ATAS NEGERI 1 GEDEG",
    kop_line4: settings.kop_line4 || "KABUPATEN MOJOKERTO",
    kop_line5: settings.kop_line5 || "Jl. Raya Gedeg No. 1, Gedeg, Mojokerto, Jawa Timur",
    kop_line6: settings.kop_line6 || "NPSN: 20503710",
    kop_logo_left: settings.kop_logo_left || "",
    kop_logo_right: settings.kop_logo_right || "",
    kop_city: settings.kop_city || "Mojokerto",
    school_year: settings.school_year || "2025/2026",
  };
}

// ============================================
// Populate Template with Data
// ============================================

function populateTemplate(html: string, s: any, settings?: Record<string, string>): string {
  const cfg = settings || {};

  // Generate today's date for signature
  const today = new Date();
  const signatureDate = `${cfg.kop_city || "Mojokerto"}, ${formatTanggalIndonesia(today)}`;

  const replacements: Record<string, string> = {
    // Kop Surat (from settings)
    "{{kopLine1}}": cfg.kop_line1 || "PEMERINTAH PROVINSI JAWA TIMUR",
    "{{kopLine2}}": cfg.kop_line2 || "DINAS PENDIDIKAN",
    "{{kopLine3}}": cfg.kop_line3 || "SEKOLAH MENENGAH ATAS NEGERI 1 GEDEG",
    "{{kopLine4}}": cfg.kop_line4 || "KABUPATEN MOJOKERTO",
    "{{kopLine5}}": cfg.kop_line5 || "",
    "{{kopLine6}}": cfg.kop_line6 || "",
    "{{kopLogoLeft}}": cfg.kop_logo_left || "",
    "{{kopLogoRight}}": cfg.kop_logo_right || "",
    "{{schoolYear}}": cfg.school_year || "2025/2026",
    "{{signatureDate}}": signatureDate,

    // System
    "{{nisn}}": s.nisn || "-",
    "{{jalur}}": s.jalur || "-",
    "{{noDiterima}}": s.noDiterima || "-",

    // Section A
    "{{namaLengkap}}": (s.biodata?.namaLengkap || s.namaPreRegister || "-").toUpperCase(),
    "{{namaPanggilan}}": (s.biodata?.namaPanggilan || "-").toUpperCase(),
    "{{jenisKelamin}}": (s.biodata?.jenisKelamin || "-").toUpperCase(),
    "{{tempatTanggalLahir}}": formatTempatTanggalLahir(
      s.biodata?.tempatLahir || "-",
      s.biodata?.tanggalLahir || s.tanggalLahirPreRegister
    ).toUpperCase(),
    "{{agama}}": (s.biodata?.agama || "-").toUpperCase(),
    "{{kewarganegaraan}}": (s.biodata?.kewarganegaraan || "WNI").toUpperCase(),
    "{{nik}}": s.biodata?.nik || "-",
    "{{anakKe}}": String(s.biodata?.anakKe || "-"),
    "{{jumlahSaudara}}": String(s.biodata?.jumlahSaudara ?? "-"),
    "{{saudaraKandung}}": String(s.biodata?.saudaraKandung ?? "-"),
    "{{saudaraTiri}}": String(s.biodata?.saudaraTiri ?? "-"),
    "{{saudaraAngkat}}": String(s.biodata?.saudaraAngkat ?? "-"),
    "{{statusYatim}}": (s.biodata?.statusYatim || "-").toUpperCase(),
    "{{bahasaSehari}}": (s.biodata?.bahasaSehari || "-").toUpperCase(),

    // Section B
    "{{alamat}}": (s.alamat?.alamatLengkap || "-").toUpperCase(),
    "{{telepon}}": s.alamat?.telepon || "-",
    "{{email}}": s.alamat?.email || "-",
    "{{tinggalDengan}}": (s.alamat?.tinggalDengan || "-").toUpperCase(),
    "{{jarakSekolah}}": s.alamat?.jarakSekolah || "-",
    "{{transportasi}}": (s.alamat?.transportasi || "-").toUpperCase(),

    // Section C
    "{{golonganDarah}}": s.kesehatan?.golonganDarah || "-",
    "{{penyakit}}": (s.kesehatan?.penyakit || "-").toUpperCase(),
    "{{kelainanJasmani}}": (s.kesehatan?.kelainanJasmani || "-").toUpperCase(),
    "{{tinggiBadanBeratBadan}}": `${s.kesehatan?.tinggiBadan || "-"} cm / ${s.kesehatan?.beratBadan || "-"} kg`,

    // Section D
    "{{asalSekolah}}": (s.pendidikan?.asalSekolah || s.asalSmpPreRegister || "-").toUpperCase(),
    "{{nomorIjazah}}": (s.pendidikan?.nomorIjazah || "-").toUpperCase(),
    "{{lamaBelajar}}": s.pendidikan?.lamaBelajar || "-",
    "{{kelas}}": s.pendidikan?.kelas || "X",

    // Section E: Ayah
    "{{namaAyah}}": (s.ayah?.nama || "-").toUpperCase(),
    "{{tempatTanggalLahirAyah}}": s.ayah?.tempatLahir && s.ayah?.tanggalLahir
      ? formatTempatTanggalLahir(s.ayah.tempatLahir, s.ayah.tanggalLahir).toUpperCase()
      : "-",
    "{{agamaAyah}}": (s.ayah?.agama || "-").toUpperCase(),
    "{{kewarganegaraanAyah}}": (s.ayah?.kewarganegaraan || "-").toUpperCase(),
    "{{pendidikanAyah}}": (s.ayah?.pendidikan || "-").toUpperCase(),
    "{{pekerjaanAyah}}": (s.ayah?.pekerjaan || "-").toUpperCase(),
    "{{penghasilanAyah}}": s.ayah?.penghasilan || "-",
    "{{alamatAyah}}": (s.ayah?.alamat || "-").toUpperCase(),
    "{{teleponAyah}}": s.ayah?.telepon || "-",
    "{{emailAyah}}": s.ayah?.email || "-",
    "{{statusAyah}}": (s.ayah?.status || "-").toUpperCase(),

    // Section F: Ibu
    "{{namaIbu}}": (s.ibu?.nama || "-").toUpperCase(),
    "{{tempatTanggalLahirIbu}}": s.ibu?.tempatLahir && s.ibu?.tanggalLahir
      ? formatTempatTanggalLahir(s.ibu.tempatLahir, s.ibu.tanggalLahir).toUpperCase()
      : "-",
    "{{agamaIbu}}": (s.ibu?.agama || "-").toUpperCase(),
    "{{kewarganegaraanIbu}}": (s.ibu?.kewarganegaraan || "-").toUpperCase(),
    "{{pendidikanIbu}}": (s.ibu?.pendidikan || "-").toUpperCase(),
    "{{pekerjaanIbu}}": (s.ibu?.pekerjaan || "-").toUpperCase(),
    "{{penghasilanIbu}}": s.ibu?.penghasilan || "-",
    "{{alamatIbu}}": (s.ibu?.alamat || "-").toUpperCase(),
    "{{teleponIbu}}": s.ibu?.telepon || "-",
    "{{emailIbu}}": s.ibu?.email || "-",
    "{{statusIbu}}": (s.ibu?.status || "-").toUpperCase(),

    // Section G: Wali
    "{{namaWali}}": (s.wali?.nama || "-").toUpperCase(),
    "{{tempatTanggalLahirWali}}": s.wali?.tempatLahir && s.wali?.tanggalLahir
      ? formatTempatTanggalLahir(s.wali.tempatLahir, s.wali.tanggalLahir).toUpperCase()
      : "-",
    "{{agamaWali}}": (s.wali?.agama || "-").toUpperCase(),
    "{{kewarganegaraanWali}}": (s.wali?.kewarganegaraan || "-").toUpperCase(),
    "{{pendidikanWali}}": (s.wali?.pendidikan || "-").toUpperCase(),
    "{{pekerjaanWali}}": (s.wali?.pekerjaan || "-").toUpperCase(),
    "{{penghasilanWali}}": s.wali?.penghasilan || "-",
    "{{alamatWali}}": (s.wali?.alamat || "-").toUpperCase(),
    "{{teleponWali}}": s.wali?.telepon || "-",
    "{{emailWali}}": s.wali?.email || "-",
    "{{statusWali}}": (s.wali?.status || "-").toUpperCase(),

    // Section H: Kegemaran
    "{{kesenian}}": (s.kegemaran?.kesenian || "-").toUpperCase(),
    "{{olahraga}}": (s.kegemaran?.olahraga || "-").toUpperCase(),
    "{{organisasi}}": (s.kegemaran?.organisasi || "-").toUpperCase(),
    "{{lainLain}}": (s.kegemaran?.lainLain || "-").toUpperCase(),
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.replaceAll(placeholder, value);
  }

  // Handle conditional blocks: {{#key}}content{{/key}} — show content only if key has value
  html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const val = replacements[`{{${key}}}`];
    return val && val !== "" ? content : "";
  });

  return html;
}

// ============================================
// Fallback HTML Template (inline)
// ============================================

function generateHtmlTemplate(student: any): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.0; }
    .header { display: flex; align-items: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
    .header .logo { height: 80px; width: auto; }
    .header-text { text-align: center; flex-grow: 1; }
    .header-text p { margin: 0; }
    .header-text h1 { margin: 0; font-size: 18px; }
    .header-text small { display: block; font-size: 10px; }
    .title { text-align: center; margin-bottom: 20px; font-weight: bold; }
    .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 10px; }
    .data-table { width: 100%; border-collapse: separate; border-spacing: 0 5px; }
    .data-table td { padding: 5px; vertical-align: top; word-wrap: break-word; }
    .data-table td:first-child { width: 50%; padding-left: 1.5em; }
    .data-table td:last-child { width: 50%; border-bottom: 1px dotted black; text-transform: uppercase; padding-left: 1.5em; }
    .sub-judul { padding-left: 3em !important; }
    .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
    .signature-block { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid black; margin-top: 100px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-text">
      <p>PEMERINTAH PROVINSI JAWA TIMUR</p>
      <p>DINAS PENDIDIKAN</p>
      <h1>SEKOLAH MENENGAH ATAS NEGERI 1 GEDEG</h1>
      <h1>KABUPATEN MOJOKERTO</h1>
      <small>Jl. Raya Gedeg No. 1, Gedeg, Mojokerto, Jawa Timur</small>
      <small style="text-align:right;font-weight:bold;">NPSN: 20503710</small>
    </div>
  </div>

  <div class="title">
    <p>DATA BUKU INDUK</p>
    <p>MURID KELAS X</p>
    <p>TAHUN PELAJARAN 2025 / 2026</p>
  </div>

  <table class="data-table">
    <tr><td>NISN</td><td>{{nisn}}</td></tr>
    <tr><td>NIK</td><td>{{nik}}</td></tr>
  </table>

  <div class="section-title">A. Keterangan tentang Diri Peserta Didik</div>
  <table class="data-table">
    <tr><td>1. Nama Lengkap</td><td>{{namaLengkap}}</td></tr>
    <tr><td>2. Nama Panggilan</td><td>{{namaPanggilan}}</td></tr>
    <tr><td>3. Jenis Kelamin</td><td>{{jenisKelamin}}</td></tr>
    <tr><td>4. Tempat dan Tanggal Lahir</td><td>{{tempatTanggalLahir}}</td></tr>
    <tr><td>5. Agama</td><td>{{agama}}</td></tr>
    <tr><td>6. Kewarganegaraan</td><td>{{kewarganegaraan}}</td></tr>
    <tr><td>7. Anak Keberapa</td><td>{{anakKe}}</td></tr>
    <tr><td>8. Jumlah Saudara</td><td>{{jumlahSaudara}}</td></tr>
    <tr><td class="sub-judul">a. Saudara Kandung</td><td>{{saudaraKandung}}</td></tr>
    <tr><td class="sub-judul">b. Saudara Tiri</td><td>{{saudaraTiri}}</td></tr>
    <tr><td class="sub-judul">c. Saudara Angkat</td><td>{{saudaraAngkat}}</td></tr>
    <tr><td>9. Status Anak</td><td>{{statusYatim}}</td></tr>
    <tr><td>10. Bahasa Sehari-hari</td><td>{{bahasaSehari}}</td></tr>
  </table>

  <div class="section-title">B. Keterangan Tempat Tinggal</div>
  <table class="data-table">
    <tr><td>11. Alamat</td><td>{{alamat}}</td></tr>
    <tr><td>12. Telepon/HP/WA</td><td>{{telepon}}</td></tr>
    <tr><td>13. Email</td><td>{{email}}</td></tr>
    <tr><td>14. Tinggal dengan</td><td>{{tinggalDengan}}</td></tr>
    <tr><td>15. Jarak ke Sekolah</td><td>{{jarakSekolah}}</td></tr>
    <tr><td>16. Transportasi</td><td>{{transportasi}}</td></tr>
  </table>

  <div class="section-title">C. Keterangan Kesehatan</div>
  <table class="data-table">
    <tr><td>17. Golongan Darah</td><td>{{golonganDarah}}</td></tr>
    <tr><td>18. Penyakit yang Pernah Diderita</td><td>{{penyakit}}</td></tr>
    <tr><td>19. Kelainan Jasmani</td><td>{{kelainanJasmani}}</td></tr>
    <tr><td>20. Tinggi dan Berat Badan</td><td>{{tinggiBadanBeratBadan}}</td></tr>
  </table>

  <div class="section-title">D. Keterangan Pendidikan</div>
  <table class="data-table">
    <tr><td>21. Asal Sekolah (SMP)</td><td>{{asalSekolah}}</td></tr>
    <tr><td>22. Tanggal dan Nomor Ijazah</td><td>{{nomorIjazah}}</td></tr>
    <tr><td>23. Lama Belajar (tahun)</td><td>{{lamaBelajar}}</td></tr>
    <tr><td>24. Diterima di Kelas</td><td>{{kelas}}</td></tr>
  </table>

  <div class="section-title">E. Keterangan tentang Ayah Kandung</div>
  <table class="data-table">
    <tr><td>25. Nama</td><td>{{namaAyah}}</td></tr>
    <tr><td>26. Tempat dan Tanggal Lahir</td><td>{{tempatTanggalLahirAyah}}</td></tr>
    <tr><td>27. Agama</td><td>{{agamaAyah}}</td></tr>
    <tr><td>28. Kewarganegaraan</td><td>{{kewarganegaraanAyah}}</td></tr>
    <tr><td>29. Pendidikan</td><td>{{pendidikanAyah}}</td></tr>
    <tr><td>30. Pekerjaan</td><td>{{pekerjaanAyah}}</td></tr>
    <tr><td>31. Penghasilan per bulan</td><td>{{penghasilanAyah}}</td></tr>
    <tr><td>32. Alamat Rumah</td><td>{{alamatAyah}}</td></tr>
    <tr><td>33. Telepon/HP/WA</td><td>{{teleponAyah}}</td></tr>
    <tr><td>34. Email</td><td>{{emailAyah}}</td></tr>
    <tr><td>35. Status</td><td>{{statusAyah}}</td></tr>
  </table>

  <div class="section-title">F. Keterangan tentang Ibu Kandung</div>
  <table class="data-table">
    <tr><td>36. Nama</td><td>{{namaIbu}}</td></tr>
    <tr><td>37. Tempat dan Tanggal Lahir</td><td>{{tempatTanggalLahirIbu}}</td></tr>
    <tr><td>38. Agama</td><td>{{agamaIbu}}</td></tr>
    <tr><td>39. Kewarganegaraan</td><td>{{kewarganegaraanIbu}}</td></tr>
    <tr><td>40. Pendidikan</td><td>{{pendidikanIbu}}</td></tr>
    <tr><td>41. Pekerjaan</td><td>{{pekerjaanIbu}}</td></tr>
    <tr><td>42. Penghasilan per bulan</td><td>{{penghasilanIbu}}</td></tr>
    <tr><td>43. Alamat Rumah</td><td>{{alamatIbu}}</td></tr>
    <tr><td>44. Telepon/HP/WA</td><td>{{teleponIbu}}</td></tr>
    <tr><td>45. Email</td><td>{{emailIbu}}</td></tr>
    <tr><td>46. Status</td><td>{{statusIbu}}</td></tr>
  </table>

  <div class="section-title">G. Keterangan tentang Wali</div>
  <table class="data-table">
    <tr><td>47. Nama</td><td>{{namaWali}}</td></tr>
    <tr><td>48. Tempat dan Tanggal Lahir</td><td>{{tempatTanggalLahirWali}}</td></tr>
    <tr><td>49. Agama</td><td>{{agamaWali}}</td></tr>
    <tr><td>50. Kewarganegaraan</td><td>{{kewarganegaraanWali}}</td></tr>
    <tr><td>51. Pendidikan</td><td>{{pendidikanWali}}</td></tr>
    <tr><td>52. Pekerjaan</td><td>{{pekerjaanWali}}</td></tr>
    <tr><td>53. Penghasilan per bulan</td><td>{{penghasilanWali}}</td></tr>
    <tr><td>54. Alamat Rumah</td><td>{{alamatWali}}</td></tr>
    <tr><td>55. Telepon/HP/WA</td><td>{{teleponWali}}</td></tr>
    <tr><td>56. Email</td><td>{{emailWali}}</td></tr>
    <tr><td>57. Status</td><td>{{statusWali}}</td></tr>
  </table>

  <div class="section-title">H. Kegemaran Peserta Didik</div>
  <table class="data-table">
    <tr><td>a. Kesenian</td><td>{{kesenian}}</td></tr>
    <tr><td>b. Olahraga</td><td>{{olahraga}}</td></tr>
    <tr><td>c. Kemasyarakatan/Organisasi</td><td>{{organisasi}}</td></tr>
    <tr><td>d. Lain-lain</td><td>{{lainLain}}</td></tr>
  </table>

  <div class="signature-section">
    <div class="signature-block">
      <p>Mengetahui,</p>
      <p>Orang Tua / Wali</p>
      <div class="signature-line"></div>
    </div>
    <div class="signature-block">
      <p>Mojokerto, .................... 2025</p>
      <p>Peserta Didik</p>
      <div class="signature-line"></div>
      <p>{{namaLengkap}}</p>
    </div>
  </div>
</body>
</html>`;
}
