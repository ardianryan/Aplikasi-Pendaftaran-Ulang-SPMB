/**
 * Excel Service
 * Handles import (parse Excel → bulk insert students)
 * and export (students data → Excel file)
 */

import ExcelJS from "exceljs";
import { Student } from "../models/Student";
import { parseTanggalExcel } from "../utils/date";
// Jalur options are now dynamic (from imported data), no hardcoded validation

// ============================================
// Types
// ============================================

interface ImportRow {
  nisn: string;
  nama: string;
  tanggalLahir: string;
  asalSmp: string;
  jalur: string;
  noDiterima: string;
}

interface ImportResult {
  success: number;
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; nisn?: string; message: string }>;
}

// ============================================
// Generate Import Template
// ============================================

/**
 * Generate an Excel template for admin to fill with pre-register data
 */
export async function generateImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SPMB-WA SMAN 1 Gedeg";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Data Siswa Diterima");

  // Define columns
  sheet.columns = [
    { header: "NISN", key: "nisn", width: 15 },
    { header: "Nama Lengkap", key: "nama", width: 35 },
    { header: "Tanggal Lahir (DD/MM/YYYY)", key: "tanggalLahir", width: 25 },
    { header: "Asal SMP", key: "asalSmp", width: 30 },
    { header: "Jalur (Tahap 1/Tahap 2/Tahap 3)", key: "jalur", width: 35 },
    { header: "No. Diterima", key: "noDiterima", width: 15 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF003F87" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Add example row
  sheet.addRow({
    nisn: "0012345678",
    nama: "CONTOH NAMA SISWA",
    tanggalLahir: "15/06/2010",
    asalSmp: "SMPN 1 Gedeg",
    jalur: "Tahap 1",
    noDiterima: "001",
  });

  // Add data validation for Jalur column
  const { Setting } = await import("../models/Setting");
  const pathSetting = await Setting.findOne({ key: "admission_paths" }).lean();
  const masterPaths = (pathSetting?.value || [])
    .filter((p: any) => p.active !== false)
    .map((p: any) => p.name);
  
  const jalurValidationList = masterPaths.length > 0 ? masterPaths : ["Tahap 1", "Tahap 2", "Tahap 3"];

  sheet.getColumn("jalur").eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`"${jalurValidationList.join(",")}"`],
      };
    }
  });

  // Add instruction sheet
  const infoSheet = workbook.addWorksheet("Petunjuk");
  infoSheet.getColumn(1).width = 50;
  infoSheet.addRow(["PETUNJUK PENGISIAN"]);
  infoSheet.addRow([""]);
  infoSheet.addRow(["1. Isi data pada sheet 'Data Siswa Diterima'"]);
  infoSheet.addRow(["2. NISN harus tepat 10 digit angka"]);
  infoSheet.addRow(["3. Tanggal Lahir format: DD/MM/YYYY (contoh: 15/06/2010)"]);
  infoSheet.addRow([`4. Jalur harus salah satu: ${jalurValidationList.join(", ")}`]);
  infoSheet.addRow(["5. Hapus baris contoh sebelum upload"]);
  infoSheet.addRow(["6. Pastikan tidak ada NISN duplikat"]);
  infoSheet.getRow(1).font = { bold: true, size: 14 };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ============================================
// Import Excel Data
// ============================================

/**
 * Parse uploaded Excel file and bulk insert/update student pre-register data
 */
export async function importFromExcel(buffer: Buffer): Promise<ImportResult> {
  const { Setting } = await import("../models/Setting");
  const pathSetting = await Setting.findOne({ key: "admission_paths" }).lean();
  const masterPaths = (pathSetting?.value || [])
    .filter((p: any) => p.active !== false)
    .map((p: any) => p.name);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.getWorksheet("Data Siswa Diterima") || workbook.worksheets[0];

  if (!sheet) {
    throw new Error("Worksheet tidak ditemukan dalam file Excel.");
  }

  const result: ImportResult = { success: 0, inserted: 0, updated: 0, failed: 0, errors: [] };
  const rows: ImportRow[] = [];

  // Helper: safely extract cell value (handles richText, formula, hyperlink objects)
  function getCellString(cell: any): string {
    const val = cell.value;
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "number") return String(val);
    if (val instanceof Date) return val.toISOString();
    // ExcelJS richText: { richText: [{ text: "..." }] }
    if (val.richText && Array.isArray(val.richText)) {
      return val.richText.map((r: any) => r.text || "").join("").trim();
    }
    // ExcelJS hyperlink: { text: "...", hyperlink: "..." }
    if (val.text) return String(val.text).trim();
    // ExcelJS formula: { result: "...", formula: "..." }
    if (val.result !== undefined) return String(val.result).trim();
    return String(val).trim();
  }

  // Helper: extract date from cell
  function getCellDate(cell: any): string {
    const val = cell.value;
    if (val instanceof Date) {
      const d = val;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
    if (val && typeof val === "object" && val.result instanceof Date) {
      const d = val.result;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
    return getCellString(cell);
  }

  // Parse rows (skip header row 1)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    // NISN might be stored as number in Excel, pad with leading zeros
    let nisn = getCellString(row.getCell(1));
    if (/^\d+$/.test(nisn) && nisn.length < 10) {
      nisn = nisn.padStart(10, "0");
    }
    const nama = getCellString(row.getCell(2));
    const asalSmp = getCellString(row.getCell(4));
    const jalur = getCellString(row.getCell(5));
    const noDiterima = getCellString(row.getCell(6));

    // Handle tanggal lahir
    const tanggalLahir = getCellDate(row.getCell(3));

    // Skip empty rows
    if (!nisn && !nama) return;

    // Validate row
    if (!nisn || nisn.length !== 10 || !/^\d{10}$/.test(nisn)) {
      result.failed++;
      result.errors.push({
        row: rowNumber,
        nisn,
        message: "NISN harus tepat 10 digit angka",
      });
      return;
    }

    if (!nama) {
      result.failed++;
      result.errors.push({ row: rowNumber, nisn, message: "Nama wajib diisi" });
      return;
    }

    if (!tanggalLahir) {
      result.failed++;
      result.errors.push({
        row: rowNumber,
        nisn,
        message: "Tanggal lahir wajib diisi",
      });
      return;
    }

    const parsedDate = parseTanggalExcel(tanggalLahir);
    if (!parsedDate) {
      result.failed++;
      result.errors.push({
        row: rowNumber,
        nisn,
        message: "Format tanggal lahir tidak valid (gunakan DD/MM/YYYY)",
      });
      return;
    }

    if (!jalur) {
      result.failed++;
      result.errors.push({
        row: rowNumber,
        nisn,
        message: "Jalur wajib diisi",
      });
      return;
    }

    // Validate Jalur against master list
    if (masterPaths.length > 0 && !masterPaths.includes(jalur)) {
      result.failed++;
      result.errors.push({
        row: rowNumber,
        nisn,
        message: `Jalur "${jalur}" tidak terdaftar di Master Jalur. Gunakan: ${masterPaths.join(", ")}`,
      });
      return;
    }

    rows.push({ nisn, nama, tanggalLahir, asalSmp, jalur, noDiterima });
  });

  // Bulk upsert valid rows (always update with latest data)
  for (const row of rows) {
    try {
      const parsedDate = parseTanggalExcel(row.tanggalLahir)!;

      const res = await Student.updateOne(
        { nisn: row.nisn },
        {
          $setOnInsert: {
            nisn: row.nisn,
            wizardStep: 1,
            isSubmitted: false,
          },
          $set: {
            namaPreRegister: row.nama,
            tanggalLahirPreRegister: parsedDate,
            asalSmpPreRegister: row.asalSmp,
            jalur: row.jalur,
            noDiterima: row.noDiterima,
          },
        },
        { upsert: true }
      );

      result.success++;
      if (res.upsertedCount > 0) {
        result.inserted++;
      } else {
        result.updated++;
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({
        row: 0,
        nisn: row.nisn,
        message: err.message || "Gagal menyimpan data",
      });
    }
  }

  return result;
}

// ============================================
// Export Students to Excel
// ============================================

/**
 * Export all student data to Excel file
 */
export async function exportToExcel(
  filter: Record<string, any> = {}
): Promise<Buffer> {
  const students = await Student.find(filter).lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SPMB-WA SMAN 1 Gedeg";

  const sheet = workbook.addWorksheet("Data Registrasi Ulang");

  // Define columns
  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "NISN", key: "nisn", width: 12 },
    { header: "Nama Lengkap", key: "nama", width: 30 },
    { header: "Jalur", key: "jalur", width: 12 },
    { header: "Asal SMP", key: "asalSmp", width: 25 },
    { header: "Jenis Kelamin", key: "jk", width: 14 },
    { header: "Tempat Lahir", key: "tempatLahir", width: 18 },
    { header: "Tanggal Lahir", key: "tglLahir", width: 14 },
    { header: "NIK", key: "nik", width: 18 },
    { header: "Agama", key: "agama", width: 10 },
    { header: "Alamat", key: "alamat", width: 35 },
    { header: "Telepon", key: "telepon", width: 15 },
    { header: "Email", key: "email", width: 25 },
    { header: "Nama Ayah", key: "namaAyah", width: 25 },
    { header: "Nama Ibu", key: "namaIbu", width: 25 },
    { header: "Status", key: "status", width: 12 },
    { header: "Submitted", key: "submitted", width: 12 },
    { header: "Verifikasi", key: "verifikasi", width: 12 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 10 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF003F87" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };

  // Add data rows
  students.forEach((s, index) => {
    sheet.addRow({
      no: index + 1,
      nisn: s.nisn,
      nama: s.biodata?.namaLengkap || s.namaPreRegister,
      jalur: s.jalur,
      asalSmp: s.asalSmpPreRegister,
      jk: s.biodata?.jenisKelamin || "",
      tempatLahir: s.biodata?.tempatLahir || "",
      tglLahir: s.biodata?.tanggalLahir
        ? new Date(s.biodata.tanggalLahir).toLocaleDateString("id-ID")
        : "",
      nik: s.biodata?.nik || "",
      agama: s.biodata?.agama || "",
      alamat: s.alamat?.alamatLengkap || "",
      telepon: s.alamat?.telepon || "",
      email: s.alamat?.email || "",
      namaAyah: s.ayah?.nama || "",
      namaIbu: s.ibu?.nama || "",
      status: s.isSubmitted ? "Submitted" : "In Progress",
      submitted: s.isSubmitted ? "Ya" : "Belum",
      verifikasi: s.verifikasi?.status || "pending",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
