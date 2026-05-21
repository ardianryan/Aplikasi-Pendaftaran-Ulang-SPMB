import mongoose from "mongoose";
import { Queue } from "../src/backend/models/Queue";
import { QueueTicket } from "../src/backend/models/QueueTicket";
import * as path from "path";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spmb";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);

  const queues = await Queue.find({}).sort({ createdAt: -1 }).limit(10).lean();
  console.log("\n--- Recent Sessions in DB ---");
  for (const q of queues) {
    console.log({
      sessionId: q.sessionId,
      mode: q.mode,
      isActive: q.isActive,
      lastIssuedNumber: q.lastIssuedNumber,
      startedAt: q.startedAt,
      endedAt: q.endedAt,
      createdAt: q.createdAt,
    });
  }

  const ticketCount = await QueueTicket.countDocuments({});
  console.log("\nTotal Queue Tickets:", ticketCount);

  if (queues.length > 0) {
    const lastSessionId = queues[0].sessionId;
    const tickets = await QueueTicket.find({ sessionId: lastSessionId }).sort({ sequenceNumber: 1 }).lean();
    console.log(`\n--- Tickets for Last Session (${lastSessionId}) ---`);
    console.log("Total tickets in this session:", tickets.length);
    console.log("First 3 tickets:", tickets.slice(0, 3).map(t => ({ ticketNumber: t.ticketNumber, status: t.status })));
    console.log("Last 3 tickets:", tickets.slice(-3).map(t => ({ ticketNumber: t.ticketNumber, status: t.status })));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
