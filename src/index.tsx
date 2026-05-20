/** @jsxImportSource hono/jsx */
import { Hono } from "hono";
import { jsx } from "hono/jsx";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

// Backend
import { connectDatabase } from "@backend/config/database";
import { routes as apiRoutes } from "@backend/routes";
import { getSettingsMap } from "@backend/utils/settings";
import { extractToken, verifyToken } from "@backend/services/jwt.service";

// Frontend Pages
import { Landing } from "./frontend/pages/Landing";
import { Login } from "./frontend/pages/Login";
import { AdminLogin } from "./frontend/pages/AdminLogin";
import { AdminDashboard } from "./frontend/pages/AdminDashboard";
import { AdminProfile } from "./frontend/pages/AdminProfile";
import { AdminStudents } from "./frontend/pages/AdminStudents";
import { AdminVerify } from "./frontend/pages/AdminVerify";
import { AdminVerifyDetail } from "./frontend/pages/AdminVerifyDetail";
import { AdminImport } from "./frontend/pages/AdminImport";
import { AdminOperators } from "./frontend/pages/AdminOperators";
import { AdminSettings } from "./frontend/pages/AdminSettings";
import { AdminLandingHeader } from "./frontend/pages/AdminLandingHeader";
import { AdminLandingJalur } from "./frontend/pages/AdminLandingJalur";
import { AdminLandingJadwal } from "./frontend/pages/AdminLandingJadwal";
import { AdminLandingBerkas } from "./frontend/pages/AdminLandingBerkas";
import { AdminAdmissionPaths } from "./frontend/pages/AdminAdmissionPaths";
import { AdminActivate } from "./frontend/pages/AdminActivate";
import { AdminWhatsApp } from "./frontend/pages/AdminWhatsApp";
import { AdminWhatsAppBlast } from "./frontend/pages/AdminWhatsAppBlast";
import { AdminWhatsAppLogs } from "./frontend/pages/AdminWhatsAppLogs";
import { QueueDisplay } from "./frontend/pages/QueueDisplay";
import { AdminQueue } from "./frontend/pages/AdminQueue";
import { AdminQueueCounter } from "./frontend/pages/AdminQueueCounter";
import { AdminQueueSettings } from "./frontend/pages/AdminQueueSettings";
import { StudentProfile } from "./frontend/pages/StudentProfile";
import { Wizard } from "./frontend/pages/Wizard";

const app = new Hono();

// Helper to render JSX with settings
const renderPage = async (c: any, Component: any, title?: string) => {
  const settings = await getSettingsMap();
  
  // Enforce registration status for student-facing pages (login, wizard, profile)
  const isStudentPage = ["/login", "/wizard", "/profile"].includes(c.req.path);
  if (isStudentPage && !settings.registration_open) {
    // If it's a direct HTML request and registration is closed, 
    // we can redirect to landing page which shows the closed message
    if (c.req.path !== "/") {
      return c.redirect("/?closed=1");
    }
  }

  return c.html(
    <Component 
      title={title} 
      settings={settings}
      appName={settings.app_name} 
      appDescription={settings.app_name_full} 
      schoolName={settings.school_name} 
      registrationOpen={settings.registration_open}
      closedMessage={settings.registration_closed_message}
    />
  );
};

// ============================================
// Global Middleware
// ============================================

// Request logging
app.use("*", logger());

// CORS - allow frontend access
app.use(
  "/api/*",
  cors({
    origin: "*", 
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Disposition"],
    maxAge: 86400,
  })
);

// ============================================
// API Routes
// ============================================

app.route("/api", apiRoutes);

// ============================================
// Frontend Routes (Hono JSX)
// ============================================

// Landing Page
app.get("/", (c) => renderPage(c, Landing));

// Login Page
app.get("/login", (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"), c.req.header("Cookie"));
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.type === "student") {
        return c.redirect("/profile");
      }
    }
  } catch (err) { /* ignore */ }
  return renderPage(c, Login, "Login");
});

// Wizard (Registration)
app.get("/wizard", (c) => renderPage(c, Wizard, "Registrasi Ulang"));

// Student Profile
app.get("/profile", (c) => renderPage(c, StudentProfile, "Profil Saya"));

// Admin Routes
app.get("/admin/login", (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"), c.req.header("Cookie"));
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.type === "admin") {
        return c.redirect("/admin/dashboard");
      }
    }
  } catch (err) { /* ignore */ }
  return renderPage(c, AdminLogin, "Admin Login");
});
app.get("/admin/dashboard", (c) => renderPage(c, AdminDashboard, "Dashboard Admin"));
app.get("/admin/profile", (c) => renderPage(c, AdminProfile, "Profil Saya"));
app.get("/admin/students", (c) => renderPage(c, AdminStudents, "Data Siswa"));
app.get("/admin/admission-paths", (c) => renderPage(c, AdminAdmissionPaths, "Master Jalur"));
app.get("/admin/verify", (c) => renderPage(c, AdminVerify, "Verifikasi"));
app.get("/admin/verify/detail", (c) => renderPage(c, AdminVerifyDetail, "Detail Verifikasi"));
app.get("/admin/import", (c) => renderPage(c, AdminImport, "Import Data"));
app.get("/admin/operators", (c) => renderPage(c, AdminOperators, "Manajemen Operator"));
app.get("/admin/settings", (c) => renderPage(c, AdminSettings, "Pengaturan Portal"));
app.get("/admin/landing/header", (c) => renderPage(c, AdminLandingHeader, "Header Hero"));
app.get("/admin/landing/jalur", (c) => renderPage(c, AdminLandingJalur, "Daftar Jalur"));
app.get("/admin/landing/jadwal", (c) => renderPage(c, AdminLandingJadwal, "Linimasa Jadwal"));
app.get("/admin/landing/berkas", (c) => renderPage(c, AdminLandingBerkas, "Berkas Wajib"));
app.get("/admin/activate", (c) => renderPage(c, AdminActivate, "Aktivasi Akun"));
app.get("/admin/whatsapp", (c) => renderPage(c, AdminWhatsApp, "WhatsApp Gateway"));
app.get("/admin/whatsapp/blast", (c) => renderPage(c, AdminWhatsAppBlast, "Blast Pesan WhatsApp"));
app.get("/admin/whatsapp/logs", (c) => renderPage(c, AdminWhatsAppLogs, "Log Pengiriman WhatsApp"));

// Antrean — Display publik (tanpa auth check, tanpa registration_open check)
app.get("/antrian", (c) => c.redirect("/antrean", 301));
app.get("/antrean", async (c) => {
  const settings = await getSettingsMap();
  return c.html(<QueueDisplay settings={settings} />);
});

// Antrean — Admin pages
app.get("/admin/queue", (c) => renderPage(c, AdminQueue, "Manajemen Antrean"));
app.get("/admin/queue/counter", (c) => renderPage(c, AdminQueueCounter, "Panel Loket"));
app.get("/admin/queue/settings", (c) => renderPage(c, AdminQueueSettings, "Pengaturan Antrean"));

// ============================================
// Static File Serving
// ============================================

// Serve static files from /public directory (CSS, JS, images, etc.)
app.use("/*", serveStatic({ root: "./public" }));

// ============================================
// Error Handling
// ============================================

app.onError((err: any, c: any) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  return c.json(
    {
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Terjadi kesalahan server"
          : err.message,
    },
    500
  );
});

app.notFound((c: any) => {
  return c.json(
    {
      success: false,
      message: "Endpoint tidak ditemukan",
    },
    404
  );
});

// ============================================
// Server Startup
// ============================================

const PORT = parseInt(process.env.PORT || "3000");

// Connect to MongoDB then start server
connectDatabase()
  .then(() => {
    console.log(`
╔══════════════════════════════════════════════╗
║  SPMB-WA Server - SMAN 1 Gedeg             ║
║  Running on: http://localhost:${PORT}          ║
║  Environment: ${process.env.NODE_ENV || "development"}            ║
║  Architecture: Hono JSX + Clean Structure  ║
╚══════════════════════════════════════════════╝
    `);

    serve({
      fetch: app.fetch,
      port: PORT,
    });
  })
  .catch((err: any) => {
    console.error("[FATAL] Failed to connect to database:", err.message);
    process.exit(1);
  });
