/**
 * Queue Controller
 * Semua handler untuk sistem antrian digital SPMB.
 */

import { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { Queue } from "../models/Queue";
import { QueueTicket } from "../models/QueueTicket";
import { Student } from "../models/Student";
import { Setting } from "../models/Setting";
import {
  addSSEClient,
  removeSSEClient,
  broadcastQueueEvent,
  startHeartbeat,
} from "../services/queue.sse";

// ============================================
// Helpers
// ============================================

/** Ambil satu sesi aktif */
async function getActiveSessionDoc() {
  return Queue.findOne({ isActive: true }).sort({ startedAt: -1 });
}

/** Format nomor tiket: prefix + nomor dengan padding */
function formatTicketNumber(prefix: string, num: number, padding: number): string {
  return `${prefix}${String(num).padStart(padding, "0")}`;
}

/**
 * Membersihkan antrean yang tersisa (waiting) pada sesi yang berakhir,
 * dan memperbarui lastIssuedNumber sesi tersebut ke nomor antrean terakhir yang dipanggil.
 */
async function cleanupEndedSession(sessionId: string) {
  try {
    const session = await Queue.findOne({ sessionId });
    if (!session) return;

    // 1. Cari tiket dengan status selain "waiting" (yaitu "serving", "done", "skipped")
    // yang memiliki sequenceNumber terbesar dalam sesi ini.
    const lastCalledTicket = await QueueTicket.findOne({
      sessionId,
      status: { $ne: "waiting" }
    }).sort({ sequenceNumber: -1 });

    let finalLastIssuedNumber = 0;

    if (lastCalledTicket) {
      finalLastIssuedNumber = lastCalledTicket.sequenceNumber;
    } else {
      // Jika sama sekali tidak ada tiket yang dipanggil/dilayani dalam sesi ini,
      // cari tiket dengan sequenceNumber terkecil dalam sesi ini, lalu kurangi 1.
      const firstTicket = await QueueTicket.findOne({ sessionId }).sort({ sequenceNumber: 1 });
      if (firstTicket) {
        finalLastIssuedNumber = Math.max(0, firstTicket.sequenceNumber - 1);
      } else {
        // Fallback ke 0 jika tidak ada tiket sama sekali di database
        finalLastIssuedNumber = 0;
      }
    }

    // 2. Perbarui lastIssuedNumber pada sesi Queue
    await Queue.updateOne(
      { sessionId },
      { lastIssuedNumber: finalLastIssuedNumber }
    );

    // 3. Hapus semua tiket "waiting" pada sesi ini
    const deleteResult = await QueueTicket.deleteMany({
      sessionId,
      status: "waiting"
    });

    console.log(`[Queue Cleanup] Sesi ${sessionId} dibersihkan. lastIssuedNumber diupdate ke ${finalLastIssuedNumber}. Menghapus ${deleteResult.deletedCount} tiket waiting.`);
  } catch (err) {
    console.error(`[Queue Cleanup] Gagal membersihkan sesi ${sessionId}:`, err);
  }
}

/** Ambil setting antrean dari DB */
async function getQueueSettings() {
  const keys = [
    "queue_pre_reg_prefix",
    "queue_re_reg_prefix",
    "queue_counter_count",
    "queue_counter_names",
    "queue_student_link_enabled",
    "queue_display_title",
    "queue_display_subtitle",
    "queue_display_show_waiting",
    "queue_number_padding",
    "queue_display_announcement_type",
    "queue_display_announcement_html",
    "queue_display_announcement_yt_id",
    "queue_display_theme",
  ];
  const settings = await Setting.find({ key: { $in: keys } }).lean();
  const map: Record<string, any> = {};
  for (const s of settings) map[s.key] = s.value;
  return {
    preRegPrefix: map.queue_pre_reg_prefix ?? "A",
    reRegPrefix: map.queue_re_reg_prefix ?? "B",
    counterCount: map.queue_counter_count ?? 5,
    counterNames: map.queue_counter_names ?? Array.from({ length: 5 }, (_, i) => `Loket ${i + 1}`),
    studentLinkEnabled: map.queue_student_link_enabled ?? false,
    displayTitle: map.queue_display_title ?? "Antrean Verifikasi SPMB",
    displaySubtitle: map.queue_display_subtitle ?? "",
    showWaiting: map.queue_display_show_waiting ?? true,
    padding: map.queue_number_padding ?? 3,
    announcementType: map.queue_display_announcement_type ?? "none",
    announcementHtml: map.queue_display_announcement_html ?? "",
    announcementYtId: map.queue_display_announcement_yt_id ?? "",
    displayTheme: map.queue_display_theme ?? "dark",
  };
}

// ============================================
// helper: broadcast status update penuh ke semua display
// ============================================

/** Broadcast status antrean terbaru ke semua display yang terhubung */
export async function broadcastQueueStatusUpdate() {
  try {
    const session = await getActiveSessionDoc();
    const settings = await getQueueSettings();

    if (session) {
      const waiting = await QueueTicket.find({
        sessionId: session.sessionId,
        status: "waiting",
      })
        .sort({ sequenceNumber: 1 })
        .limit(20)
        .select("ticketNumber sequenceNumber studentName")
        .lean();

      await broadcastQueueEvent({
        type: "status_update",
        data: {
          active: true,
          sessionId: session.sessionId,
          mode: session.mode,
          prefix: session.prefix,
          studentLinkEnabled: session.studentLinkEnabled,
          currentServing: session.currentServing,
          waiting: waiting.map((t) => ({
            ticketNumber: t.ticketNumber,
            sequenceNumber: t.sequenceNumber,
            studentName: t.studentName,
          })),
          displayTitle: settings.displayTitle,
          displaySubtitle: settings.displaySubtitle,
          showWaiting: settings.showWaiting,
          announcementType: settings.announcementType,
          announcementHtml: settings.announcementHtml,
          announcementYtId: settings.announcementYtId,
          displayTheme: settings.displayTheme,
        },
      });
    } else {
      await broadcastQueueEvent({
        type: "status_update",
        data: {
          active: false,
          currentServing: [],
          waiting: [],
          announcementType: settings.announcementType,
          announcementHtml: settings.announcementHtml,
          announcementYtId: settings.announcementYtId,
          displayTheme: settings.displayTheme,
          displayTitle: settings.displayTitle,
          displaySubtitle: settings.displaySubtitle,
        },
      });
    }
  } catch (err) {
    console.error("[SSE] Gagal menyiarkan status antrean terbaru:", err);
  }
}

// ============================================
// 1. PUBLIC — GET /status
// Digunakan oleh display TV sebagai fallback jika SSE disconnect
// ============================================

export const getQueueStatus = async (c: Context) => {
  try {
    const session = await getActiveSessionDoc();
    const settings = await getQueueSettings();

    if (!session) {
      return c.json({
        success: true,
        data: {
          active: false,
          currentServing: [],
          waiting: [],
          announcementType: settings.announcementType,
          announcementHtml: settings.announcementHtml,
          announcementYtId: settings.announcementYtId,
          displayTheme: settings.displayTheme,
          displayTitle: settings.displayTitle,
          displaySubtitle: settings.displaySubtitle,
        },
      });
    }

    // Ambil tiket yang sedang menunggu (max 20 untuk display)
    const waiting = await QueueTicket.find({
      sessionId: session.sessionId,
      status: "waiting",
    })
      .sort({ sequenceNumber: 1 })
      .limit(20)
      .select("ticketNumber sequenceNumber studentName")
      .lean();

    return c.json({
      success: true,
      data: {
        active: true,
        sessionId: session.sessionId,
        mode: session.mode,
        prefix: session.prefix,
        displayTitle: settings.displayTitle,
        displaySubtitle: settings.displaySubtitle,
        showWaiting: settings.showWaiting,
        studentLinkEnabled: session.studentLinkEnabled,
        counterCount: session.counterCount,
        counterNames: session.counterNames,
        currentServing: session.currentServing,
        waiting: waiting.map((t) => ({
          ticketNumber: t.ticketNumber,
          sequenceNumber: t.sequenceNumber,
          studentName: t.studentName,
        })),
        lastIssuedNumber: session.lastIssuedNumber,
        announcementType: settings.announcementType,
        announcementHtml: settings.announcementHtml,
        announcementYtId: settings.announcementYtId,
        displayTheme: settings.displayTheme,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat status antrean" }, 500);
  }
};

// ============================================
// 2. PUBLIC — GET /stream (SSE)
// ============================================

export const getSSEStream = async (c: Context) => {
  startHeartbeat(); // Pastikan heartbeat berjalan

  return streamSSE(c, async (stream) => {
    const clientId = uuidv4();

    const writer: Parameters<typeof addSSEClient>[0] = {
      id: clientId,
      send: async (event) => {
        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event.data),
          id: uuidv4(),
        });
      },
      abort: () => stream.close(),
    };

    addSSEClient(writer);

    // Kirim status awal saat connect
    try {
      const session = await getActiveSessionDoc();
      const settings = await getQueueSettings();

      if (session) {
        const waiting = await QueueTicket.find({
          sessionId: session.sessionId,
          status: "waiting",
        })
          .sort({ sequenceNumber: 1 })
          .limit(20)
          .select("ticketNumber sequenceNumber studentName")
          .lean();

        await stream.writeSSE({
          event: "status_update",
          data: JSON.stringify({
            active: true,
            sessionId: session.sessionId,
            mode: session.mode,
            prefix: session.prefix,
            studentLinkEnabled: session.studentLinkEnabled,
            currentServing: session.currentServing,
            waiting: waiting,
            displayTitle: settings.displayTitle,
            displaySubtitle: settings.displaySubtitle,
            showWaiting: settings.showWaiting,
            announcementType: settings.announcementType,
            announcementHtml: settings.announcementHtml,
            announcementYtId: settings.announcementYtId,
            displayTheme: settings.displayTheme,
          }),
          id: uuidv4(),
        });
      } else {
        await stream.writeSSE({
          event: "status_update",
          data: JSON.stringify({
            active: false,
            announcementType: settings.announcementType,
            announcementHtml: settings.announcementHtml,
            announcementYtId: settings.announcementYtId,
            displayTheme: settings.displayTheme,
            displayTitle: settings.displayTitle,
            displaySubtitle: settings.displaySubtitle,
          }),
          id: uuidv4(),
        });
      }
    } catch {
      // Tidak fatal jika initial status gagal
    }

    // Tunggu hingga koneksi ditutup
    await stream.sleep(1000 * 60 * 60 * 24); // max 24 jam
    removeSSEClient(clientId);
  });
};

// ============================================
// 3. ADMIN — GET /session
// ============================================

export const getActiveSession = async (c: Context): Promise<Response> => {
  try {
    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: true, data: null });
    }

    const stats = await QueueTicket.aggregate<{ _id: string; count: number }>([
      { $match: { sessionId: session.sessionId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statMap: Record<string, number> = {};
    for (const s of stats) statMap[s._id] = s.count;

    return c.json({
      success: true,
      data: {
        ...session.toObject(),
        stats: {
          waiting: statMap.waiting ?? 0,
          serving: statMap.serving ?? 0,
          done: statMap.done ?? 0,
          skipped: statMap.skipped ?? 0,
          total: Object.values(statMap).reduce((a, b) => a + b, 0),
        },
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat sesi antrian" }, 500);
  }
};

// ============================================
// 4. ADMIN — POST /session/start
// ============================================

export const startSession = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const mode: "pre_registration" | "re_registration" =
      body.mode === "re_registration" ? "re_registration" : "pre_registration";

    const batchSize = parseInt(body.batchSize) || 50;
    const continueFromLast = body.continueFromLast === true || body.continueFromLast === "true";

    const settings = await getQueueSettings();
    const prefix = mode === "pre_registration" ? settings.preRegPrefix : settings.reRegPrefix;

    // Tutup dan bersihkan sesi aktif sebelumnya jika ada
    const activeSessions = await Queue.find({ isActive: true });
    for (const activeSess of activeSessions) {
      await Queue.updateOne(
        { sessionId: activeSess.sessionId },
        { isActive: false, endedAt: new Date() }
      );
      await cleanupEndedSession(activeSess.sessionId);
    }

    // 1. Dapatkan startNumber jika continue dari sesi terakhir
    let startNumber = 0;
    if (continueFromLast) {
      const lastSession = await Queue.findOne({ mode }).sort({ createdAt: -1 });
      if (lastSession) {
        startNumber = lastSession.lastIssuedNumber || 0;
      }
    }

    // Bangun currentServing kosong sesuai jumlah loket
    const count = settings.counterCount;
    const names = settings.counterNames.slice(0, count);
    // Pastikan panjang names sesuai count
    while (names.length < count) names.push(`Loket ${names.length + 1}`);

    const currentServing = Array.from({ length: count }, (_, i) => ({
      counterId: i + 1,
      counterName: names[i],
      ticketNumber: null,
      ticketId: null,
      calledAt: null,
      status: "tutup",
      operators: [],
    }));

    const sessionId = uuidv4();

    // 2. Pre-generate tiket antrean secara batch
    const tickets = [];
    for (let i = 1; i <= batchSize; i++) {
      const seqNum = startNumber + i;
      const ticketNumber = formatTicketNumber(prefix, seqNum, settings.padding);
      tickets.push({
        sessionId,
        ticketNumber,
        sequenceNumber: seqNum,
        mode,
        status: "waiting",
      });
    }

    if (tickets.length > 0) {
      await QueueTicket.insertMany(tickets);
    }

    const session = await Queue.create({
      sessionId,
      mode,
      prefix,
      counterCount: count,
      counterNames: names,
      studentLinkEnabled: settings.studentLinkEnabled,
      currentServing,
      lastIssuedNumber: startNumber + batchSize,
      isActive: true,
      startedAt: new Date(),
    });

    await broadcastQueueEvent({
      type: "session_start",
      data: {
        sessionId: session.sessionId,
        mode: session.mode,
        prefix: session.prefix,
        counterCount: session.counterCount,
        counterNames: session.counterNames,
        currentServing: session.currentServing,
      },
    });

    await broadcastQueueStatusUpdate();

    return c.json({ success: true, data: session });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 5. ADMIN — POST /session/end
// ============================================

export const endSession = async (c: Context) => {
  try {
    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi aktif" }, 404);
    }

    await Queue.updateOne(
      { sessionId: session.sessionId },
      { isActive: false, endedAt: new Date() }
    );

    // Bersihkan tiket waiting tersisa dan perbarui lastIssuedNumber
    await cleanupEndedSession(session.sessionId);

    await broadcastQueueEvent({
      type: "session_end",
      data: { sessionId: session.sessionId },
    });

    await broadcastQueueStatusUpdate();

    return c.json({ success: true, message: "Sesi antrian diakhiri" });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 6. OPERATOR — POST /ticket
// Terbitkan nomor antrian baru
// ============================================

export const issueTicket = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const session = await getActiveSessionDoc();

    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi antrian aktif" }, 400);
    }

    const settings = await getQueueSettings();

    // Atomically increment lastIssuedNumber
    const updatedSession = await Queue.findOneAndUpdate(
      { sessionId: session.sessionId, isActive: true },
      { $inc: { lastIssuedNumber: 1 } },
      { new: true }
    );

    if (!updatedSession) {
      return c.json({ success: false, message: "Sesi tidak ditemukan" }, 404);
    }

    const num = updatedSession.lastIssuedNumber;
    const ticketNumber = formatTicketNumber(session.prefix, num, settings.padding);

    // Resolve link siswa jika diaktifkan
    let studentId = null;
    let studentName = null;
    let studentNisn = null;

    if (session.studentLinkEnabled && body.studentNisn) {
      const student = await Student.findOne({ nisn: body.studentNisn })
        .select("namaPreRegister nisn")
        .lean();
      if (student) {
        studentId = student._id;
        studentName = student.namaPreRegister;
        studentNisn = student.nisn;
      }
    }

    const ticket = await QueueTicket.create({
      sessionId: session.sessionId,
      ticketNumber,
      sequenceNumber: num,
      mode: session.mode,
      status: "waiting",
      studentId,
      studentName,
      studentNisn,
    });

    // Broadcast update status lengkap ke semua display
    await broadcastQueueStatusUpdate();

    return c.json({
      success: true,
      data: { ticketNumber, sequenceNumber: num, studentName, ticketId: ticket._id },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 7. OPERATOR — POST /call
// Panggil nomor antrian berikutnya untuk loket tertentu
// ============================================

export const callNext = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const counterId = parseInt(body.counterId);

    if (!counterId || counterId < 1) {
      return c.json({ success: false, message: "counterId tidak valid" }, 400);
    }

    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi aktif" }, 400);
    }

    const counterInfo = session.currentServing.find((c) => c.counterId === counterId);
    if (!counterInfo) {
      return c.json({ success: false, message: "Loket tidak ditemukan" }, 404);
    }

    // Cari tiket waiting dengan nomor urut terkecil
    const nextTicket = await QueueTicket.findOne({
      sessionId: session.sessionId,
      status: "waiting",
    }).sort({ sequenceNumber: 1 });

    if (!nextTicket) {
      return c.json({ success: false, message: "Tidak ada antrian yang menunggu" }, 404);
    }

    const now = new Date();

    // Update tiket → serving
    await QueueTicket.updateOne(
      { _id: nextTicket._id },
      {
        status: "serving",
        counterId,
        counterName: counterInfo.counterName,
        calledAt: now,
      }
    );

    // Update currentServing di sesi
    await Queue.updateOne(
      { sessionId: session.sessionId, "currentServing.counterId": counterId },
      {
        $set: {
          "currentServing.$.ticketNumber": nextTicket.ticketNumber,
          "currentServing.$.ticketId": nextTicket._id,
          "currentServing.$.calledAt": now,
          "currentServing.$.status": "buka",
        },
      }
    );

    await broadcastQueueEvent({
      type: "call",
      data: {
        ticketNumber: nextTicket.ticketNumber,
        counterId,
        counterName: counterInfo.counterName,
        studentName: nextTicket.studentName,
        studentNisn: nextTicket.studentNisn,
        calledAt: now.toISOString(),
      },
    });

    await broadcastQueueStatusUpdate();

    return c.json({
      success: true,
      data: {
        ticketNumber: nextTicket.ticketNumber,
        counterId,
        counterName: counterInfo.counterName,
        studentName: nextTicket.studentName,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 8. OPERATOR — POST /call/specific
// Panggil nomor tiket tertentu (panggil ulang / out-of-order)
// ============================================

export const callSpecific = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const counterId = parseInt(body.counterId);
    const ticketNumber = String(body.ticketNumber || "").toUpperCase().trim();

    if (!counterId || !ticketNumber) {
      return c.json({ success: false, message: "counterId dan ticketNumber diperlukan" }, 400);
    }

    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi aktif" }, 400);
    }

    const counterInfo = session.currentServing.find((c) => c.counterId === counterId);
    if (!counterInfo) {
      return c.json({ success: false, message: "Loket tidak ditemukan" }, 404);
    }

    const ticket = await QueueTicket.findOne({
      sessionId: session.sessionId,
      ticketNumber,
    });

    if (!ticket) {
      return c.json({ success: false, message: `Tiket ${ticketNumber} tidak ditemukan` }, 404);
    }

    const now = new Date();

    await QueueTicket.updateOne(
      { _id: ticket._id },
      {
        status: "serving",
        counterId,
        counterName: counterInfo.counterName,
        calledAt: now,
      }
    );

    await Queue.updateOne(
      { sessionId: session.sessionId, "currentServing.counterId": counterId },
      {
        $set: {
          "currentServing.$.ticketNumber": ticket.ticketNumber,
          "currentServing.$.ticketId": ticket._id,
          "currentServing.$.calledAt": now,
          "currentServing.$.status": "buka",
        },
      }
    );

    await broadcastQueueEvent({
      type: "call",
      data: {
        ticketNumber: ticket.ticketNumber,
        counterId,
        counterName: counterInfo.counterName,
        studentName: ticket.studentName,
        studentNisn: ticket.studentNisn,
        calledAt: now.toISOString(),
      },
    });

    await broadcastQueueStatusUpdate();

    return c.json({
      success: true,
      data: {
        ticketNumber: ticket.ticketNumber,
        counterId,
        counterName: counterInfo.counterName,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 9. OPERATOR — POST /done
// Tandai nomor yang sedang dilayani di loket sebagai selesai
// ============================================

export const markDone = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const counterId = parseInt(body.counterId);

    if (!counterId) {
      return c.json({ success: false, message: "counterId diperlukan" }, 400);
    }

    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi aktif" }, 400);
    }

    const counterInfo = session.currentServing.find((c) => c.counterId === counterId);
    if (!counterInfo || !counterInfo.ticketId) {
      return c.json({ success: false, message: "Tidak ada tiket aktif di loket ini" }, 404);
    }

    const now = new Date();

    await QueueTicket.updateOne(
      { _id: counterInfo.ticketId },
      { status: "done", doneAt: now }
    );

    // Reset loket
    await Queue.updateOne(
      { sessionId: session.sessionId, "currentServing.counterId": counterId },
      {
        $set: {
          "currentServing.$.ticketNumber": null,
          "currentServing.$.ticketId": null,
          "currentServing.$.calledAt": null,
        },
      }
    );

    await broadcastQueueEvent({
      type: "done",
      data: {
        ticketNumber: counterInfo.ticketNumber,
        counterId,
        counterName: counterInfo.counterName,
      },
    });

    await broadcastQueueStatusUpdate();

    return c.json({ success: true, message: "Tiket ditandai selesai" });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 10. OPERATOR — POST /skip
// Lewati nomor antrian (tidak hadir)
// ============================================

export const skipTicket = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const counterId = parseInt(body.counterId);

    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi aktif" }, 400);
    }

    const counterInfo = session.currentServing.find((c) => c.counterId === counterId);
    if (!counterInfo || !counterInfo.ticketId) {
      return c.json({ success: false, message: "Tidak ada tiket aktif di loket ini" }, 404);
    }

    await QueueTicket.updateOne(
      { _id: counterInfo.ticketId },
      { status: "skipped", doneAt: new Date() }
    );

    await Queue.updateOne(
      { sessionId: session.sessionId, "currentServing.counterId": counterId },
      {
        $set: {
          "currentServing.$.ticketNumber": null,
          "currentServing.$.ticketId": null,
          "currentServing.$.calledAt": null,
        },
      }
    );

    await broadcastQueueEvent({
      type: "skip",
      data: {
        ticketNumber: counterInfo.ticketNumber,
        counterId,
        counterName: counterInfo.counterName,
      },
    });

    await broadcastQueueStatusUpdate();

    return c.json({ success: true, message: "Tiket dilewati" });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 11. ADMIN — GET /tickets
// Daftar semua tiket dalam sesi aktif (paginated)
// ============================================

export const getTicketList = async (c: Context) => {
  try {
    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: true, data: [], meta: { total: 0 } });
    }

    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "50");
    const status = c.req.query("status");

    const filter: Record<string, any> = { sessionId: session.sessionId };
    if (status) filter.status = status;

    const total = await QueueTicket.countDocuments(filter);
    const tickets = await QueueTicket.find(filter)
      .sort({ sequenceNumber: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return c.json({
      success: true,
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sessionId: session.sessionId,
        mode: session.mode,
        prefix: session.prefix,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

// ============================================
// 12. OPERATOR / ADMIN — NEW HANDLERS
// ============================================

export const addSessionTickets = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const count = parseInt(body.count);
    if (!count || count < 1) {
      return c.json({ success: false, message: "Jumlah tiket tidak valid" }, 400);
    }

    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi antrean aktif" }, 400);
    }

    const settings = await getQueueSettings();

    // Increment lastIssuedNumber atomically by `count`
    const updatedSession = await Queue.findOneAndUpdate(
      { sessionId: session.sessionId, isActive: true },
      { $inc: { lastIssuedNumber: count } },
      { new: true }
    );

    if (!updatedSession) {
      return c.json({ success: false, message: "Sesi tidak ditemukan" }, 404);
    }

    const endNum = updatedSession.lastIssuedNumber;
    const startNum = endNum - count;

    const tickets = [];
    for (let i = 1; i <= count; i++) {
      const seqNum = startNum + i;
      const ticketNumber = formatTicketNumber(session.prefix, seqNum, settings.padding);
      tickets.push({
        sessionId: session.sessionId,
        ticketNumber,
        sequenceNumber: seqNum,
        mode: session.mode,
        status: "waiting",
      });
    }

    await QueueTicket.insertMany(tickets);
    await broadcastQueueStatusUpdate();

    return c.json({ success: true, message: `${count} tiket baru berhasil ditambahkan` });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

export const joinCounter = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const counterId = parseInt(body.counterId);
    if (!counterId || counterId < 1) {
      return c.json({ success: false, message: "counterId tidak valid" }, 400);
    }

    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi antrean aktif" }, 400);
    }

    const adminId = c.get("adminId");
    const username = c.get("adminUsername");
    const admin = await mongoose.model("Admin").findById(adminId).lean() as any;
    const name = admin?.nama || username || "Operator";

    const queue = await Queue.findOne({ sessionId: session.sessionId, isActive: true });
    if (!queue) {
      return c.json({ success: false, message: "Sesi tidak ditemukan" }, 404);
    }

    // 1. Clean this operator from any other counters
    for (const cs of queue.currentServing) {
      const idx = cs.operators.findIndex(o => o.adminId === adminId);
      if (idx !== -1) {
        cs.operators.splice(idx, 1);
        if (cs.operators.length === 0) {
          cs.status = "tutup";
        }
      }
    }

    // Find target counter
    const target = queue.currentServing.find(cs => cs.counterId === counterId);
    if (!target) {
      return c.json({ success: false, message: "Loket tidak ditemukan" }, 404);
    }

    // Cek batasan maksimal 2 operator
    if (target.operators.length >= 2) {
      const opNames = target.operators.map(o => o.name).join(" dan ");
      return c.json({
        success: false,
        message: `Loket ini sudah ditangani oleh ${opNames}. Maksimal 2 operator.`
      }, 400);
    }

    // Tambahkan operator ke target counter
    target.operators.push({
      adminId,
      name,
      lastSeen: new Date()
    });

    // Ubah status menjadi "buka" jika sebelumnya "tutup"
    if (target.status === "tutup") {
      target.status = "buka";
    }

    await queue.save();
    await broadcastQueueStatusUpdate();

    return c.json({
      success: true,
      data: {
        counterId: target.counterId,
        counterName: target.counterName,
        status: target.status,
        operators: target.operators
      }
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

export const leaveCounter = async (c: Context) => {
  try {
    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: true, message: "Tidak ada sesi aktif" });
    }

    const adminId = c.get("adminId");

    const queue = await Queue.findOne({ sessionId: session.sessionId, isActive: true });
    if (!queue) {
      return c.json({ success: true, message: "Sesi tidak ditemukan" });
    }

    let leftCounterId = null;
    for (const cs of queue.currentServing) {
      const idx = cs.operators.findIndex(o => o.adminId === adminId);
      if (idx !== -1) {
        cs.operators.splice(idx, 1);
        leftCounterId = cs.counterId;
        if (cs.operators.length === 0) {
          cs.status = "tutup";
        }
      }
    }

    if (leftCounterId !== null) {
      await queue.save();
      await broadcastQueueStatusUpdate();
    }

    return c.json({ success: true, message: "Berhasil meninggalkan loket" });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};

export const updateCounterStatus = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const status: "buka" | "istirahat" = body.status === "istirahat" ? "istirahat" : "buka";

    const session = await getActiveSessionDoc();
    if (!session) {
      return c.json({ success: false, message: "Tidak ada sesi aktif" }, 400);
    }

    const adminId = c.get("adminId");

    const queue = await Queue.findOne({ sessionId: session.sessionId, isActive: true });
    if (!queue) {
      return c.json({ success: false, message: "Sesi tidak ditemukan" }, 404);
    }

    // Temukan loket tempat operator aktif
    const target = queue.currentServing.find(cs => cs.operators.some(o => o.adminId === adminId));
    if (!target) {
      return c.json({ success: false, message: "Anda tidak sedang aktif di loket mana pun" }, 400);
    }

    target.status = status;
    await queue.save();
    await broadcastQueueStatusUpdate();

    return c.json({
      success: true,
      data: {
        counterId: target.counterId,
        status: target.status
      }
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
};
