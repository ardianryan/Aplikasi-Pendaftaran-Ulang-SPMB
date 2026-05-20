/**
 * Queue Model - MongoDB Schema
 * Menyimpan konfigurasi dan status sesi antrian aktif.
 * Satu sesi aktif pada satu waktu (isActive = true).
 */

import mongoose, { Schema, Document } from "mongoose";

interface ICurrentServing {
  counterId: number;       // 1-indexed
  counterName: string;
  ticketNumber: string | null;
  ticketId: mongoose.Types.ObjectId | null;
  calledAt: Date | null;
}

export interface IQueue extends Document {
  sessionId: string;
  mode: "pre_registration" | "re_registration";
  prefix: string;
  counterCount: number;
  counterNames: string[];
  studentLinkEnabled: boolean;
  currentServing: ICurrentServing[];
  lastIssuedNumber: number;
  isActive: boolean;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CurrentServingSubSchema = new Schema<ICurrentServing>(
  {
    counterId: { type: Number, required: true },
    counterName: { type: String, required: true },
    ticketNumber: { type: String, default: null },
    ticketId: { type: Schema.Types.ObjectId, ref: "QueueTicket", default: null },
    calledAt: { type: Date, default: null },
  },
  { _id: false }
);

const QueueSchema = new Schema<IQueue>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["pre_registration", "re_registration"],
      required: true,
      default: "pre_registration",
    },
    prefix: {
      type: String,
      required: true,
      default: "A",
      trim: true,
      uppercase: true,
    },
    counterCount: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
      max: 20,
    },
    counterNames: {
      type: [String],
      default: ["Loket 1", "Loket 2", "Loket 3", "Loket 4", "Loket 5"],
    },
    studentLinkEnabled: {
      type: Boolean,
      default: false,
    },
    currentServing: {
      type: [CurrentServingSubSchema],
      default: [],
    },
    lastIssuedNumber: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "queues",
  }
);

QueueSchema.index({ isActive: 1 });

export const Queue = mongoose.model<IQueue>("Queue", QueueSchema);
