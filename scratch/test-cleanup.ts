import mongoose from "mongoose";
import { Queue } from "../src/backend/models/Queue";
import { QueueTicket } from "../src/backend/models/QueueTicket";

async function cleanupEndedSession(sessionId: string) {
  try {
    const session = await Queue.findOne({ sessionId });
    if (!session) return;

    // 1. Cari tiket dengan status selain "waiting" (yaitu "serving", "done", "skipped")
    // yang memiliki sequenceNumber terbesar dalam sesi ini.
    const lastCalledTicket = await QueueTicket.findOne({
      sessionId,
      status: { $ne: "waiting" }
    }).sort({ sequenceNumber: -1 });

    let finalLastIssuedNumber = 0;

    if (lastCalledTicket) {
      finalLastIssuedNumber = lastCalledTicket.sequenceNumber;
    } else {
      // Jika sama sekali tidak ada tiket yang dipanggil/dilayani dalam sesi ini,
      // cari tiket dengan sequenceNumber terkecil dalam sesi ini, lalu kurangi 1.
      const firstTicket = await QueueTicket.findOne({ sessionId }).sort({ sequenceNumber: 1 });
      if (firstTicket) {
        finalLastIssuedNumber = Math.max(0, firstTicket.sequenceNumber - 1);
      } else {
        // Fallback ke 0 jika tidak ada tiket sama sekali di database
        finalLastIssuedNumber = 0;
      }
    }

    // 2. Perbarui lastIssuedNumber pada sesi Queue
    await Queue.updateOne(
      { sessionId },
      { lastIssuedNumber: finalLastIssuedNumber }
    );

    // 3. Hapus semua tiket "waiting" pada sesi ini
    const deleteResult = await QueueTicket.deleteMany({
      sessionId,
      status: "waiting"
    });

    console.log(`[Queue Cleanup] Sesi ${sessionId} dibersihkan. lastIssuedNumber diupdate ke ${finalLastIssuedNumber}. Menghapus ${deleteResult.deletedCount} tiket waiting.`);
  } catch (err) {
    console.error(`[Queue Cleanup] Gagal membersihkan sesi ${sessionId}:`, err);
  }
}

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spmb";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);

  const testSessionId = "6b3339e3-871b-4cbf-bf2c-4612e378ead4";
  console.log("\nBefore Cleanup:");
  const beforeSession = await Queue.findOne({ sessionId: testSessionId }).lean();
  console.log("Session lastIssuedNumber:", beforeSession?.lastIssuedNumber);
  const beforeTicketsCount = await QueueTicket.countDocuments({ sessionId: testSessionId });
  console.log("Session tickets count:", beforeTicketsCount);

  console.log("\nExecuting cleanup...");
  await cleanupEndedSession(testSessionId);

  console.log("\nAfter Cleanup:");
  const afterSession = await Queue.findOne({ sessionId: testSessionId }).lean();
  console.log("Session lastIssuedNumber:", afterSession?.lastIssuedNumber);
  const afterTicketsCount = await QueueTicket.countDocuments({ sessionId: testSessionId });
  console.log("Session tickets count:", afterTicketsCount);

  await mongoose.disconnect();
}

run().catch(console.error);
