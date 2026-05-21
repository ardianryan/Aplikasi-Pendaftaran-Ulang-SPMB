/**
 * Queue Routes
 * Endpoint antrian digital SPMB
 * Dibagi: publik (tanpa auth), operator (adminAuth), admin (adminAuth + role check)
 */

import { Hono } from "hono";
import { adminAuth, requirePermission } from "../middleware/auth.middleware";
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
  addSessionTickets,
  joinCounter,
  leaveCounter,
  updateCounterStatus,
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
queueRoutes.post("/session/start", adminAuth, requirePermission("operator_can_manage_queue"), startSession);
queueRoutes.post("/session/end", adminAuth, requirePermission("operator_can_manage_queue"), endSession);

// Terbitkan tiket antrian baru
queueRoutes.post("/ticket", adminAuth, requirePermission("operator_can_manage_queue"), issueTicket);

// Tambah tiket antrian secara batch
queueRoutes.post("/session/add-tickets", adminAuth, requirePermission("operator_can_manage_queue"), addSessionTickets);

// Gabung ke loket
queueRoutes.post("/counter/join", adminAuth, joinCounter);

// Tinggalkan loket
queueRoutes.post("/counter/leave", adminAuth, leaveCounter);

// Update status loket (buka/istirahat)
queueRoutes.post("/counter/status", adminAuth, updateCounterStatus);

// Panggil nomor berikutnya di loket X
queueRoutes.post("/call", adminAuth, requirePermission("operator_can_manage_queue"), callNext);

// Panggil nomor tertentu (re-call / out-of-order)
queueRoutes.post("/call/specific", adminAuth, requirePermission("operator_can_manage_queue"), callSpecific);

// Tandai selesai dilayani
queueRoutes.post("/done", adminAuth, requirePermission("operator_can_manage_queue"), markDone);

// Lewati / skip nomor
queueRoutes.post("/skip", adminAuth, requirePermission("operator_can_manage_queue"), skipTicket);

// Daftar tiket sesi aktif (paginated)
queueRoutes.get("/tickets", adminAuth, getTicketList);

export { queueRoutes };
