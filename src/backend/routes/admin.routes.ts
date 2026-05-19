/**
 * Admin Routes
 * All endpoints for admin/operator dashboard
 * Protected by adminAuth middleware
 */

import { Hono } from "hono";
import { adminAuth } from "../middleware/auth.middleware";
import {
  getStats,
  getStudents,
  addStudent,
  getStudentDetail,
  adminDownloadPdf,
  updateStudentData,
  deleteStudent,
  verifyStudent,
  importStudents,
  getImportTemplate,
  exportStudents,
  getSettings,
  updateSettings,
  uploadSettingsFile,
  pullSSOMembers,
  createOperator,
  getOperators,
  updateOperator,
  deleteOperator,
  getReferrals,
  createReferral,
  deleteReferral,
  toggleReferral,
  getProfile,
  updateProfile,
} from "../controllers/admin.controller";

import {
  waStatus,
  waTest,
  waSend,
  waBlastPreview,
  waBlast,
  waLogs,
  waLogsCleanup,
} from "../controllers/wa.controller";

const adminRoutes = new Hono();

// All admin routes require authentication
adminRoutes.use("*", adminAuth);

// Dashboard statistics
adminRoutes.get("/stats", getStats);

// Profile management
adminRoutes.get("/profile", getProfile);
adminRoutes.put("/profile", updateProfile);

// Student management
adminRoutes.get("/students", getStudents);
adminRoutes.post("/students", addStudent);
adminRoutes.get("/students/:id", getStudentDetail);
adminRoutes.get("/students/:id/pdf", adminDownloadPdf); // Admin download student PDF
adminRoutes.put("/students/:id/update", updateStudentData); // Admin edit student data
adminRoutes.delete("/students/:id", deleteStudent);

// Verification
adminRoutes.put("/students/:id/verify", verifyStudent);

// Import / Export
adminRoutes.post("/import", importStudents);
adminRoutes.get("/import/template", getImportTemplate);
adminRoutes.get("/export", exportStudents);

// Settings
adminRoutes.get("/settings", getSettings);
adminRoutes.put("/settings", updateSettings);
adminRoutes.post("/settings/upload/:key", uploadSettingsFile); // Upload logo/icon

// SSO & Operator Management
adminRoutes.post("/sso/pull", pullSSOMembers); // Pull guru/tendik from ScholarGate
adminRoutes.get("/operators", getOperators); // List all operators
adminRoutes.post("/operators", createOperator); // Create local operator
adminRoutes.put("/operators/:id", updateOperator); // Update operator role/status
adminRoutes.delete("/operators/:id", deleteOperator); // Remove operator

// Referral Code Management
adminRoutes.get("/referrals", getReferrals); // List all referral codes
adminRoutes.post("/referrals", createReferral); // Create new prefix
adminRoutes.delete("/referrals/:id", deleteReferral); // Delete referral
adminRoutes.put("/referrals/:id/toggle", toggleReferral); // Toggle active/inactive

// WhatsApp Gateway
adminRoutes.get("/wa/status", waStatus);
adminRoutes.post("/wa/test", waTest);
adminRoutes.post("/wa/send", waSend);
adminRoutes.get("/wa/blast/preview", waBlastPreview);
adminRoutes.post("/wa/blast", waBlast);
adminRoutes.get("/wa/logs", waLogs);
adminRoutes.delete("/wa/logs/cleanup", waLogsCleanup);

export { adminRoutes };
