import mongoose from "mongoose";
import { Setting } from "../models/Setting";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spmb";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  
  const settings = await Setting.find({ key: { $regex: /^queue_/ } }).lean();
  console.log("\n--- Queue Settings in DB ---");
  for (const s of settings) {
    console.log(`${s.key}:`, JSON.stringify(s.value));
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
