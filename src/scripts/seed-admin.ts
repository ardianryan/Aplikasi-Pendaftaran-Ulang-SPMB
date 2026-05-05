/**
 * Seed Admin Script
 * Creates the default admin user: admin / admin123
 * Run with: bun run src/scripts/seed-admin.ts
 */

import mongoose from "mongoose";
import { Admin } from "../models/Admin";
import { Setting, DEFAULT_SETTINGS } from "../models/Setting";

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI not set. Create a .env file first.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("[SEED] Connected to MongoDB");

    // ============================================
    // Seed Admin User
    // ============================================

    const existingAdmin = await Admin.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("[SEED] Admin user already exists. Skipping...");
    } else {
      const admin = new Admin({
        username: "admin",
        passwordHash: "admin123", // Will be hashed by pre-save hook
        nama: "Administrator",
        role: "admin",
      });

      await admin.save();
      console.log("[SEED] Admin user created successfully:");
      console.log("       Username: admin");
      console.log("       Password: admin123");
      console.log("       Role: admin");
    }

    // ============================================
    // Seed Default Settings
    // ============================================

    const existingSettings = await Setting.countDocuments();

    if (existingSettings > 0) {
      console.log("[SEED] Settings already exist. Skipping...");
    } else {
      await Setting.insertMany(DEFAULT_SETTINGS);
      console.log(`[SEED] ${DEFAULT_SETTINGS.length} default settings created.`);
    }

    console.log("\n[SEED] Seeding complete!");
  } catch (err: any) {
    console.error("[SEED] Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
