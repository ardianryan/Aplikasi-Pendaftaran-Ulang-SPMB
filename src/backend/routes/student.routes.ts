/**
 * Student Routes
 * All endpoints for the student wizard flow
 * Protected by studentAuth + lockedGuard middleware
 */

import { Hono } from "hono";
import { studentAuth } from "../middleware/auth.middleware";
import { lockedGuard } from "../middleware/locked.middleware";
import {
  getProfile,
  confirmData,
  getBiodata,
  updateBiodata,
  completeBiodata,
  getReview,
  submitFinal,
  downloadPdf,
  requestQueueTicket,
} from "../controllers/student.controller";

const studentRoutes = new Hono();

// All student routes require authentication
studentRoutes.use("*", studentAuth);

// GET /student/profile - Get pre-register data + wizard state
studentRoutes.get("/profile", getProfile);

// POST /student/confirm - Confirm identity (Step 1 → Step 2)
studentRoutes.post("/confirm", lockedGuard, confirmData);

// GET /student/biodata - Get saved biodata
studentRoutes.get("/biodata", getBiodata);

// PUT /student/biodata - Auto-save biodata (partial)
studentRoutes.put("/biodata", lockedGuard, updateBiodata);

// POST /student/biodata/complete - Mark biodata complete (Step 2 → Step 3)
studentRoutes.post("/biodata/complete", lockedGuard, completeBiodata);

// GET /student/review - Get all data for review (Step 4)
studentRoutes.get("/review", getReview);

// POST /student/submit - Final submission (locks form)
studentRoutes.post("/submit", lockedGuard, submitFinal);

// GET /student/pdf - Download PDF bukti registrasi
studentRoutes.get("/pdf", downloadPdf);

// POST /student/queue/join - Claim queue ticket dynamically
studentRoutes.post("/queue/join", requestQueueTicket);

export { studentRoutes };
