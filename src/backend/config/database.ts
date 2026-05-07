/**
 * MongoDB Connection Configuration
 * Uses Mongoose ODM with connection pooling
 */

import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    await mongoose.connect(uri, {
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("[DB] Connected to MongoDB successfully");

    // Connection event handlers
    mongoose.connection.on("error", (err) => {
      console.error("[DB] MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[DB] MongoDB disconnected. Attempting reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[DB] MongoDB reconnected successfully");
    });
  } catch (error) {
    console.error("[DB] Failed to connect to MongoDB:", error);
    throw error;
  }
}

export function getDatabase() {
  return mongoose.connection;
}
