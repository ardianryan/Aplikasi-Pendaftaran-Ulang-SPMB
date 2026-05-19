/**
 * WhatsApp Controller
 * Admin endpoints for WA gateway management, sending, blast, and logs.
 */

import type { Context } from "hono";
import { Setting } from "../models/Setting";
import { Student } from "../models/Student";
import { WALog } from "../models/WALog";
import {
  createWhatsAppAdapter,
  renderTemplate,
  normalizePhone,
} from "../services/whatsapp/whatsapp.service";
import { success, error, paginated } from "../utils/response";

// ============================================
// GET /admin/wa/status
// Check gateway connection status
// ============================================
export async function waStatus(c: Context) {
  try {
    const adapter = await createWhatsAppAdapter();
    if (!adapter) {
      return success(c, {
        enabled: false,
        connected: false,
        provider: null,
        message: "WhatsApp gateway belum diaktifkan atau URL belum diisi.",
      });
    }
    const status = await adapter.getStatus();
    return success(c, {
      enabled: true,
      connected: status.connected,
      provider: adapter.providerName,
      deviceId: status.deviceId || "",
      pushName: status.pushName || "",
    });
  } catch (err: any) {
    return error(c, "Gagal memeriksa status gateway: " + err.message, 500);
  }
}

// ============================================
// POST /admin/wa/test
// Send a test message to a specific number
// Body: { phone, message? }
// ============================================
export async function waTest(c: Context) {
  try {
    const body = await c.req.json();
    const phone = body.phone;
    if (!phone) return error(c, "Nomor telepon wajib diisi.", 422);

    const adapter = await createWhatsAppAdapter();
    if (!adapter) return error(c, "WhatsApp gateway belum aktif.", 400);

    const message =
      body.message || "✅ Ini adalah pesan test dari SPMB-WA. Gateway terhubung!";
    const result = await adapter.sendMessage(phone, message);

    // Log
    await WALog.create({
      recipientPhone: normalizePhone(phone),
      recipientName: "Test",
      messageType: "custom",
      messageContent: message,
      status: result.success ? "sent" : "failed",
      messageId: result.messageId || "",
      errorMessage: result.error || "",
      sentBy: c.get("adminUsername") || "admin",
    });

    return success(c, result, result.success ? "Pesan test terkirim." : "Gagal mengirim pesan test.");
  } catch (err: any) {
    return error(c, "Gagal mengirim pesan test: " + err.message, 500);
  }
}

// ============================================
// POST /admin/wa/send
// Send individual message to a student
// Body: { studentId?, phone?, message, messageType? }
// ============================================
export async function waSend(c: Context) {
  try {
    const body = await c.req.json();
    const { studentId, phone, message, messageType = "custom" } = body;

    if (!message) return error(c, "Pesan wajib diisi.", 422);

    let targetPhone = phone || "";
    let targetName = "";
    let targetNisn = "";

    if (studentId) {
      const student = await Student.findById(studentId).lean();
      if (!student) return error(c, "Siswa tidak ditemukan.", 404);
      targetPhone = student.alamat?.telepon || "";
      targetName = student.biodata?.namaLengkap || (student as any).namaLengkap || "";
      targetNisn = student.nisn || "";
    }

    if (!targetPhone) return error(c, "Nomor telepon siswa tidak tersedia.", 422);

    const adapter = await createWhatsAppAdapter();
    if (!adapter) return error(c, "WhatsApp gateway belum aktif.", 400);

    const result = await adapter.sendMessage(targetPhone, message);

    await WALog.create({
      recipientPhone: normalizePhone(targetPhone),
      recipientName: targetName,
      recipientNisn: targetNisn,
      messageType,
      messageContent: message,
      status: result.success ? "sent" : "failed",
      messageId: result.messageId || "",
      errorMessage: result.error || "",
      sentBy: c.get("adminUsername") || "admin",
    });

    return success(c, result, result.success ? "Pesan terkirim." : "Gagal mengirim pesan.");
  } catch (err: any) {
    return error(c, "Gagal mengirim pesan: " + err.message, 500);
  }
}

// ============================================
// GET /admin/wa/blast/preview
// Preview blast recipients count based on filter
// Query: filter=not_started|biodata|upload|not_submitted&jalur=...
// ============================================
export async function waBlastPreview(c: Context) {
  try {
    const filter = c.req.query("filter") || "not_submitted";
    const jalur = c.req.query("jalur") || "";

    const query = buildBlastQuery(filter, jalur);
    const count = await Student.countDocuments(query);
    const sample = await Student.find(query)
      .select("nisn namaLengkap biodata.namaLengkap alamat.telepon jalur wizardStep")
      .limit(5)
      .lean();

    return success(c, {
      filter,
      jalur: jalur || "semua",
      count,
      sample: sample.map((s) => ({
        nisn: s.nisn,
        nama: s.biodata?.namaLengkap || (s as any).namaLengkap || "",
        telepon: s.alamat?.telepon || "",
        jalur: s.jalur || "",
        wizardStep: s.wizardStep,
      })),
    });
  } catch (err: any) {
    return error(c, "Gagal memuat preview: " + err.message, 500);
  }
}

// ============================================
// POST /admin/wa/blast
// Send blast messages
// Body: { filter, jalur?, templateKey?, customMessage?, delayMs? }
// ============================================
export async function waBlast(c: Context) {
  try {
    const body = await c.req.json();
    const { filter, jalur, templateKey, customMessage, delayMs = 5000 } = body;

    if (!filter) return error(c, "Filter wajib diisi.", 422);

    const adapter = await createWhatsAppAdapter();
    if (!adapter) return error(c, "WhatsApp gateway belum aktif.", 400);

    // Get template
    let messageTemplate = customMessage || "";
    if (!messageTemplate && templateKey) {
      const tpl = await Setting.findOne({ key: templateKey }).lean();
      messageTemplate = tpl?.value || "";
    }
    if (!messageTemplate) {
      return error(c, "Template pesan atau pesan custom wajib diisi.", 422);
    }

    // Get school info for template variables
    const schoolSettings = await Setting.find({
      key: { $in: ["school_name", "school_year", "app_name"] },
    }).lean();
    const settingsMap: Record<string, string> = {};
    for (const s of schoolSettings) settingsMap[s.key] = String(s.value || "");
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    // Query students
    const query = buildBlastQuery(filter, jalur || "");
    const students = await Student.find(query)
      .select("nisn namaLengkap biodata.namaLengkap alamat.telepon jalur")
      .lean();

    if (students.length === 0) {
      return success(c, { sent: 0, failed: 0, total: 0 }, "Tidak ada penerima ditemukan.");
    }

    const adminUsername = c.get("adminUsername") || "admin";

    // Process in background with delay
    const actualDelay = Math.max(delayMs, 5000); // Minimum 5 second delay
    processBlastQueue(
      adapter,
      students,
      messageTemplate,
      settingsMap,
      appUrl,
      filter,
      adminUsername,
      actualDelay
    );

    return success(c, {
      total: students.length,
      status: "queued",
      delayMs: actualDelay,
      estimatedMinutes: Math.ceil((students.length * actualDelay) / 60000),
    }, `Blast ke ${students.length} penerima sedang diproses.`);
  } catch (err: any) {
    return error(c, "Gagal memulai blast: " + err.message, 500);
  }
}

// ============================================
// GET /admin/wa/logs
// Paginated message logs
// Query: page, limit, status?, type?
// ============================================
export async function waLogs(c: Context) {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const status = c.req.query("status") || "";
    const type = c.req.query("type") || "";

    const query: any = {};
    if (status) query.status = status;
    if (type) query.messageType = type;

    const [logs, total] = await Promise.all([
      WALog.find(query)
        .sort({ sentAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WALog.countDocuments(query),
    ]);

    return paginated(c, logs, { page, limit, total });
  } catch (err: any) {
    return error(c, "Gagal memuat log: " + err.message, 500);
  }
}

// ============================================
// DELETE /admin/wa/logs/cleanup
// Delete logs older than retention period
// ============================================
export async function waLogsCleanup(c: Context) {
  try {
    const retentionSetting = await Setting.findOne({ key: "wa_log_retention_days" }).lean();
    const days = parseInt(retentionSetting?.value) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await WALog.deleteMany({ sentAt: { $lt: cutoff } });

    return success(c, {
      deletedCount: result.deletedCount,
      retentionDays: days,
      cutoffDate: cutoff.toISOString(),
    }, `${result.deletedCount} log lebih dari ${days} hari telah dihapus.`);
  } catch (err: any) {
    return error(c, "Gagal membersihkan log: " + err.message, 500);
  }
}

// ============================================
// Helper: Build blast query
// ============================================
function buildBlastQuery(filter: string, jalur: string) {
  const query: any = {};

  switch (filter) {
    case "not_started":
      // Never logged in / confirmed
      query.wizardStep = 1;
      query.isSubmitted = { $ne: true };
      break;
    case "biodata":
      // Confirmed but biodata incomplete
      query.wizardStep = { $gte: 1, $lt: 3 };
      query.isSubmitted = { $ne: true };
      break;
    case "upload":
      // Biodata done but not uploaded
      query.wizardStep = 3;
      query.isSubmitted = { $ne: true };
      break;
    case "not_submitted":
    default:
      // All data done but not submitted
      query.isSubmitted = { $ne: true };
      break;
  }

  if (jalur) {
    query.jalur = jalur;
  }

  return query;
}

// ============================================
// Helper: Background blast queue processor
// ============================================
async function processBlastQueue(
  adapter: any,
  students: any[],
  template: string,
  settingsMap: Record<string, string>,
  appUrl: string,
  messageType: string,
  adminUsername: string,
  delayMs: number
) {
  for (const student of students) {
    const phone = student.alamat?.telepon;
    if (!phone) continue;

    const nama = student.biodata?.namaLengkap || student.namaLengkap || "";
    const vars: Record<string, string> = {
      nama,
      nisn: student.nisn || "",
      jalur: student.jalur || "",
      sekolah: settingsMap.school_name || "",
      tahun: settingsMap.school_year || "",
      url: appUrl,
    };

    const message = renderTemplate(template, vars);

    try {
      const result = await adapter.sendMessage(phone, message);
      await WALog.create({
        recipientPhone: normalizePhone(phone),
        recipientName: nama,
        recipientNisn: student.nisn || "",
        messageType: "blast",
        messageContent: message,
        status: result.success ? "sent" : "failed",
        messageId: result.messageId || "",
        errorMessage: result.error || "",
        sentBy: adminUsername,
      });
    } catch (err: any) {
      await WALog.create({
        recipientPhone: normalizePhone(phone),
        recipientName: nama,
        recipientNisn: student.nisn || "",
        messageType: "blast",
        messageContent: message,
        status: "failed",
        errorMessage: err.message || "Unknown error",
        sentBy: adminUsername,
      });
    }

    // Delay between messages to prevent ban
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
