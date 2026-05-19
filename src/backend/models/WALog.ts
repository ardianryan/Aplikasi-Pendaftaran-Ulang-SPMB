/**
 * WALog Model — WhatsApp Message Log
 * Tracks all outgoing WhatsApp messages sent by admin
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IWALog extends Document {
  recipientPhone: string;
  recipientName: string;
  recipientNisn: string;
  messageType:
    | "reminder"
    | "biodata"
    | "verified"
    | "rejected"
    | "blast"
    | "custom";
  messageContent: string;
  status: "sent" | "failed" | "queued";
  messageId: string;
  errorMessage: string;
  sentBy: string;
  sentAt: Date;
}

const WALogSchema = new Schema<IWALog>(
  {
    recipientPhone: { type: String, required: true, index: true },
    recipientName: { type: String, default: "" },
    recipientNisn: { type: String, default: "" },
    messageType: {
      type: String,
      enum: ["reminder", "biodata", "verified", "rejected", "blast", "custom"],
      required: true,
    },
    messageContent: { type: String, required: true },
    status: {
      type: String,
      enum: ["sent", "failed", "queued"],
      default: "queued",
    },
    messageId: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    sentBy: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    collection: "wa_logs",
  }
);

// TTL index is NOT set here — log retention is enforced manually via
// the admin cleanup endpoint based on the `wa_log_retention_days` setting.

export const WALog = mongoose.model<IWALog>("WALog", WALogSchema);
