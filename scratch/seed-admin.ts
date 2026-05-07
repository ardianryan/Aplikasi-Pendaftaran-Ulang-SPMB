
import mongoose from "mongoose";
import { Admin } from "../src/backend/models/Admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found");

  await mongoose.connect(uri);
  console.log("Connected to DB");

  const count = await Admin.countDocuments();
  if (count === 0) {
    console.log("No admins found. Creating default admin...");
    await Admin.create({
      username: "admin",
      passwordHash: "admin123", // Will be hashed by pre-save hook
      nama: "Super Admin",
      role: "admin",
      isActive: true,
      authMethod: "local"
    });
    console.log("Default admin created: admin / admin123");
  } else {
    console.log(`Found ${count} admins. Seeding skipped.`);
    const admins = await Admin.find().select("username role");
    console.log("Existing admins:", admins);
  }

  await mongoose.connection.close();
}

seed().catch(console.error);
