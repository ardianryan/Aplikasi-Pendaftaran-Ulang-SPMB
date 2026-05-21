/**
 * Admin Routes
 * All endpoints for admin/operator dashboard
 * Protected by adminAuth middleware
 */

import { Hono } from "hono";
import { adminAuth, requireAdmin, requirePermission } from "../middleware/auth.middleware";
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
adminRoutes.post("/students", requirePermission("operator_can_edit_student"), addStudent);
adminRoutes.get("/students/:id", getStudentDetail);
adminRoutes.get("/students/:id/pdf", adminDownloadPdf); // Admin download student PDF
adminRoutes.put("/students/:id/update", requirePermission("operator_can_edit_student"), updateStudentData); // Admin edit student data
adminRoutes.delete("/students/:id", requirePermission("operator_can_delete_student"), deleteStudent);

// Verification
adminRoutes.put("/students/:id/verify", requirePermission("operator_can_verify"), verifyStudent);

// Import / Export
adminRoutes.post("/import", requireAdmin, importStudents);
adminRoutes.get("/import/template", requireAdmin, getImportTemplate);
adminRoutes.get("/export", requireAdmin, exportStudents);

// Settings
adminRoutes.get("/settings", getSettings);
adminRoutes.put("/settings", requireAdmin, updateSettings);
adminRoutes.post("/settings/upload/:key", requireAdmin, uploadSettingsFile); // Upload logo/icon

// SSO & Operator Management
adminRoutes.post("/sso/pull", requireAdmin, pullSSOMembers); // Pull guru/tendik from ScholarGate
adminRoutes.get("/operators", requireAdmin, getOperators); // List all operators
adminRoutes.post("/operators", requireAdmin, createOperator); // Create local operator
adminRoutes.put("/operators/:id", requireAdmin, updateOperator); // Update operator role/status
adminRoutes.delete("/operators/:id", requireAdmin, deleteOperator); // Remove operator

// Referral Code Management
adminRoutes.get("/referrals", requireAdmin, getReferrals); // List all referral codes
adminRoutes.post("/referrals", requireAdmin, createReferral); // Create new prefix
adminRoutes.delete("/referrals/:id", requireAdmin, deleteReferral); // Delete referral
adminRoutes.put("/referrals/:id/toggle", requireAdmin, toggleReferral); // Toggle active/inactive

// WhatsApp Gateway
adminRoutes.get("/wa/status", requirePermission("operator_can_whatsapp"), waStatus);
adminRoutes.post("/wa/test", requirePermission("operator_can_whatsapp"), waTest);
adminRoutes.post("/wa/send", requirePermission("operator_can_whatsapp"), waSend);
adminRoutes.get("/wa/blast/preview", requirePermission("operator_can_whatsapp"), waBlastPreview);
adminRoutes.post("/wa/blast", requirePermission("operator_can_whatsapp"), waBlast);
adminRoutes.get("/wa/logs", requirePermission("operator_can_whatsapp"), waLogs);
adminRoutes.delete("/wa/logs/cleanup", requirePermission("operator_can_whatsapp"), waLogsCleanup);

export { adminRoutes };
