/**
 * Date Utilities
 * Indonesian locale date formatting for display and PDF generation
 */

const BULAN_INDONESIA = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/**
 * Format date to Indonesian format: "DD NamaBulan YYYY"
 * Example: "15 Januari 2010"
 */
export function formatTanggalIndonesia(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const day = d.getDate();
  const month = BULAN_INDONESIA[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format date to "Tempat, DD NamaBulan YYYY"
 * Used in buku induk for tempat & tanggal lahir combined
 */
export function formatTempatTanggalLahir(
  tempat: string,
  tanggal: Date | string
): string {
  const formattedDate = formatTanggalIndonesia(tanggal);
  return `${tempat}, ${formattedDate}`;
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 * Used for HTML date input values
 */
export function formatISODate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Parse date string (from Excel import) to Date object
 * Supports: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, and native Date strings
 */
export function parseTanggalExcel(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Handle DD/MM/YYYY or DD-MM-YYYY format
  const slashParts = dateStr.split("/");
  const dashParts = dateStr.split("-");

  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10) - 1; // 0-indexed
    const year = parseInt(slashParts[2], 10);
    if (day > 0 && day <= 31 && month >= 0 && month <= 11 && year > 1900) {
      // Use UTC to avoid timezone offset issues
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Handle YYYY-MM-DD format (ISO)
  if (dashParts.length === 3 && dashParts[0].length === 4) {
    const year = parseInt(dashParts[0], 10);
    const month = parseInt(dashParts[1], 10) - 1;
    const day = parseInt(dashParts[2], 10);
    if (day > 0 && day <= 31 && month >= 0 && month <= 11 && year > 1900) {
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Handle DD-MM-YYYY format
  if (dashParts.length === 3 && dashParts[2].length === 4) {
    const day = parseInt(dashParts[0], 10);
    const month = parseInt(dashParts[1], 10) - 1;
    const year = parseInt(dashParts[2], 10);
    if (day > 0 && day <= 31 && month >= 0 && month <= 11 && year > 1900) {
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Fallback: try native Date parsing
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}
