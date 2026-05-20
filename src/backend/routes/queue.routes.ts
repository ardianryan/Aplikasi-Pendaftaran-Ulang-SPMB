/**
 * Queue Routes
 * Endpoint antrian digital SPMB
 * Dibagi: publik (tanpa auth), operator (adminAuth), admin (adminAuth + role check)
 */

import { Hono } from "hono";
import { adminAuth } from "../middleware/auth.middleware";
import {
  getQueueStatus,
  getSSEStream,
  getActiveSession,
  startSession,
  endSession,
  issueTicket,
  callNext,
  callSpecific,
  markDone,
  skipTicket,
  getTicketList,
} from "../controllers/queue.controller";

const queueRoutes = new Hono();

// ============================================
// PUBLIC — tanpa auth (untuk display TV, siswa dari rumah)
// ============================================

// Status semua loket + daftar tunggu (fallback polling)
queueRoutes.get("/status", getQueueStatus);

// SSE stream real-time
queueRoutes.get("/stream", getSSEStream);

// ============================================
// OPERATOR / ADMIN — butuh auth
// ============================================

// Info sesi aktif + statistik
queueRoutes.get("/session", adminAuth, getActiveSession);

// Mulai / akhiri sesi
queueRoutes.post("/session/start", adminAuth, startSession);
queueRoutes.post("/session/end", adminAuth, endSession);

// Terbitkan tiket antrian baru
queueRoutes.post("/ticket", adminAuth, issueTicket);

// Panggil nomor berikutnya di loket X
queueRoutes.post("/call", adminAuth, callNext);

// Panggil nomor tertentu (re-call / out-of-order)
queueRoutes.post("/call/specific", adminAuth, callSpecific);

// Tandai selesai dilayani
queueRoutes.post("/done", adminAuth, markDone);

// Lewati / skip nomor
queueRoutes.post("/skip", adminAuth, skipTicket);

// Daftar tiket sesi aktif (paginated)
queueRoutes.get("/tickets", adminAuth, getTicketList);

export { queueRoutes };
