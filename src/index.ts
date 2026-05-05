/**
 * SPMB-WA: Aplikasi Registrasi Ulang Siswa Baru SMAN 1 Gedeg
 * Entry point - Hono.js server running on Bun
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { connectDatabase } from "./config/database";
import { routes } from "./routes";

const app = new Hono();

// ============================================
// Global Middleware
// ============================================

// Request logging
app.use("*", logger());

// CORS - allow frontend access
app.use(
  "/api/*",
  cors({
    origin: "*", // In production, restrict to your domain
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Disposition"],
    maxAge: 86400,
  })
);

// ============================================
// API Routes
// ============================================

app.route("/api", routes);

// ============================================
// Static File Serving (Frontend) + Pretty URLs
// ============================================

// Pretty URLs: rewrite /login → /login.html, /admin/dashboard → /admin/dashboard.html
// This allows clean URLs without .html extension
app.use("*", async (c, next) => {
  const path = c.req.path;

  // Skip API routes, files with extensions, and root path
  if (
    path.startsWith("/api") ||
    path.includes(".") ||
    path === "/"
  ) {
    return next();
  }

  // Check if a corresponding .html file exists by rewriting the request
  const htmlPath = `${path}.html`;
  const file = Bun.file(`./public${htmlPath}`);
  if (await file.exists()) {
    return c.html(await file.text());
  }

  // Check for index.html inside directory (e.g., /admin → /admin/index.html)
  const indexPath = `${path}/index.html`;
  const indexFile = Bun.file(`./public${indexPath}`);
  if (await indexFile.exists()) {
    return c.html(await indexFile.text());
  }

  return next();
});

// Serve static files from /public directory (CSS, JS, images, etc.)
app.use("/*", serveStatic({ root: "./public" }));

// Fallback: serve index.html for unmatched routes
app.get("/*", serveStatic({ root: "./public", path: "index.html" }));

// ============================================
// Error Handling
// ============================================

app.onError((err, c) => {
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

app.notFound((c) => {
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
╚══════════════════════════════════════════════╝
    `);
  })
  .catch((err) => {
    console.error("[FATAL] Failed to connect to database:", err.message);
    process.exit(1);
  });

export default {
  port: PORT,
  fetch: app.fetch,
};
