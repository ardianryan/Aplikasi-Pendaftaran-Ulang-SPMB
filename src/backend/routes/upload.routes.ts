/**
 * Upload Routes
 * Handles document upload and deletion for student wizard Step 3
 */

import { Hono } from "hono";
import { studentAuth } from "../middleware/auth.middleware";
import { lockedGuard } from "../middleware/locked.middleware";
import { uploadDocument, deleteDocument } from "../controllers/upload.controller";

const uploadRoutes = new Hono();

// All upload routes require student auth + not locked
uploadRoutes.use("*", studentAuth);
uploadRoutes.use("*", lockedGuard);

// POST /upload/:docType - Upload a document
uploadRoutes.post("/:docType", uploadDocument);

// DELETE /upload/:docType - Remove an uploaded document
uploadRoutes.delete("/:docType", deleteDocument);

export { uploadRoutes };
