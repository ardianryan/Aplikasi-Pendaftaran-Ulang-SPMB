/**
 * Auth Routes
 * POST /auth/login           - Student login (NISN + Tanggal Lahir)
 * POST /auth/admin/login     - Admin login (username + password)
 * POST /auth/google          - Admin/Operator login via Google OAuth
 * GET  /auth/google/client-id - Get Google Client ID for frontend
 */

import { Hono } from "hono";
import { loginStudent, loginAdmin, loginGoogle, activateOperator } from "../controllers/auth.controller";

const authRoutes = new Hono();

// Student login
authRoutes.post("/login", loginStudent);

// Admin login (local username/password)
authRoutes.post("/admin/login", loginAdmin);

// Admin/Operator login via Google (ID token from frontend)
authRoutes.post("/google", loginGoogle);

// Activate operator with referral code (after Google login returns needs_referral)
authRoutes.post("/activate-operator", activateOperator);

// Public: Get Google Client ID for frontend Sign-In button
authRoutes.get("/google/client-id", (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  return c.json({
    success: true,
    data: { clientId: clientId || null },
  });
});

export { authRoutes };
