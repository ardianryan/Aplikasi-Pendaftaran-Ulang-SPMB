
import mongoose from "mongoose";
import { Admin } from "../src/backend/models/Admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function reset() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found");

  await mongoose.connect(uri);
  console.log("Connected to DB");

  const admin = await Admin.findOne({ username: "admin" });
  if (admin) {
    console.log("Updating password for admin...");
    admin.passwordHash = "admin123"; 
    await admin.save();
    console.log("Password reset to: admin123");
  } else {
    console.log("Admin user not found. Creating...");
    await Admin.create({
      username: "admin",
      passwordHash: "admin123",
      nama: "Super Admin",
      role: "admin",
      isActive: true,
      authMethod: "local"
    });
    console.log("Admin created: admin / admin123");
  }

  await mongoose.connection.close();
}

reset().catch(console.error);
