/**
 * Route Aggregator
 * Mounts all route groups under /api prefix
 */

import { Hono } from "hono";
import { authRoutes } from "./auth.routes";
import { studentRoutes } from "./student.routes";
import { uploadRoutes } from "./upload.routes";
import { adminRoutes } from "./admin.routes";
import { Setting, DEFAULT_SETTINGS } from "../models/Setting";

const routes = new Hono();

// Auth routes: /api/auth/*
routes.route("/auth", authRoutes);

// Student wizard routes: /api/student/*
routes.route("/student", studentRoutes);

// Upload routes: /api/upload/*
routes.route("/upload", uploadRoutes);

// Admin routes: /api/admin/*
routes.route("/admin", adminRoutes);

// ============================================
// Public Settings (no auth required)
// Returns only public-facing settings for frontend rendering
// ============================================
routes.get("/settings/public", async (c) => {
  try {
    let settings = await Setting.find().lean();

    // Seed defaults if empty
    if (settings.length === 0) {
      await Setting.insertMany(DEFAULT_SETTINGS);
      settings = await Setting.find().lean();
    }

    // Only expose public-safe keys
    const publicKeys = [
      "school_name",
      "school_name_full",
      "app_name",
      "app_name_full",
      "app_logo",
      "app_icon",
      "registration_open",
      "registration_closed_message",
      "registration_start_date",
      "registration_end_date",
      "school_year",
      "announcement_text",
      "kop_line1",
      "kop_line2",
      "kop_line3",
      "kop_line4",
      "kop_line5",
      "kop_line6",
      "kop_logo_left",
      "kop_logo_right",
      "kop_city",
    ];

    const result: Record<string, any> = {};
    for (const s of settings) {
      if (publicKeys.includes(s.key)) {
        result[s.key] = s.value;
      }
    }

    // Also expose R2 public URL for document viewing
    result.r2_public_url = process.env.R2_PUBLIC_URL || "";

    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat pengaturan." }, 500);
  }
});

// Public: Get distinct jalur values from master paths
routes.get("/jalur-options", async (c) => {
  try {
    const { Setting } = await import("../models/Setting");
    const pathSetting = await Setting.findOne({ key: "admission_paths" }).lean();
    
    if (pathSetting && Array.isArray(pathSetting.value)) {
      const activePaths = pathSetting.value
        .filter((p: any) => p.active !== false)
        .map((p: any) => p.name);
      
      if (activePaths.length > 0) {
        return c.json({ success: true, data: activePaths });
      }
    }

    // Fallback to distinct students if master paths not found
    const { Student } = await import("../models/Student");
    const jalurList = await Student.distinct("jalur");
    const options = jalurList.filter((j: any) => j && j.trim() !== "").sort();
    return c.json({ success: true, data: options });
  } catch (err: any) {
    return c.json({ success: true, data: [] });
  }
});

// Health check
routes.get("/health", (c) => {
  return c.json({
    success: true,
    message: "SPMB-WA API is running",
    timestamp: new Date().toISOString(),
  });
});

export { routes };
