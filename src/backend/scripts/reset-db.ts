/**
 * Reset Database Script
 * WARNING: This will delete ALL data in the database!
 * After deleting, it will re-seed the default admin and settings.
 */

import mongoose from "mongoose";
import { Admin } from "../models/Admin";
import { Student } from "../models/Student";
import { Setting, DEFAULT_SETTINGS } from "../models/Setting";
import { ReferralCode } from "../models/ReferralCode";

async function reset() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI not set. Create a .env file first.");
    process.exit(1);
  }

  try {
    console.log("[RESET] Connecting to MongoDB...");
    await mongoose.connect(uri);
    
    const dbName = mongoose.connection.name;
    console.log(`[RESET] Dropping database: ${dbName}...`);
    
    // Drop all collections to ensure a clean slate
    await mongoose.connection.db?.dropDatabase();
    console.log("[RESET] Database dropped successfully.");

    // ============================================
    // Re-seed Default Data
    // ============================================
    console.log("[RESET] Re-seeding initial data...");

    // Create Super Admin
    const admin = new Admin({
      username: "admin",
      passwordHash: "admin123", // Will be hashed by pre-save hook
      nama: "Administrator",
      role: "admin",
      isActive: true
    });
    await admin.save();
    
    console.log("[RESET] Super Admin created: admin / admin123");

    // Insert Default Settings
    await Setting.insertMany(DEFAULT_SETTINGS);
    console.log(`[RESET] ${DEFAULT_SETTINGS.length} default settings restored.`);

    console.log("\n[RESET] Database has been successfully reset to initial state!");
  } catch (err: any) {
    console.error("[RESET] Error during reset:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

reset();
