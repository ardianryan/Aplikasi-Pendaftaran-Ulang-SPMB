/**
 * QueueTicket Model - MongoDB Schema
 * Menyimpan setiap tiket antrian yang diterbitkan dalam satu sesi.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IQueueTicket extends Document {
  sessionId: string;
  ticketNumber: string;       // Nomor lengkap: "A001"
  sequenceNumber: number;     // Nomor urut murni: 1, 2, 3...
  mode: "pre_registration" | "re_registration";
  status: "waiting" | "serving" | "done" | "skipped";

  counterId: number | null;
  counterName: string | null;
  calledAt: Date | null;
  doneAt: Date | null;

  // Link ke siswa (opsional, aktif jika session.studentLinkEnabled = true)
  studentId: mongoose.Types.ObjectId | null;
  studentName: string | null;
  studentNisn: string | null;

  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const QueueTicketSchema = new Schema<IQueueTicket>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    ticketNumber: {
      type: String,
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ["pre_registration", "re_registration"],
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "serving", "done", "skipped"],
      default: "waiting",
      index: true,
    },
    counterId: {
      type: Number,
      default: null,
    },
    counterName: {
      type: String,
      default: null,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    doneAt: {
      type: Date,
      default: null,
    },
    // Link ke siswa (opsional)
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    studentName: {
      type: String,
      default: null,
    },
    studentNisn: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "queue_tickets",
  }
);

// Index gabungan untuk query performa tinggi
QueueTicketSchema.index({ sessionId: 1, status: 1 });
QueueTicketSchema.index({ sessionId: 1, sequenceNumber: 1 });
QueueTicketSchema.index({ sessionId: 1, ticketNumber: 1 }, { unique: true });

export const QueueTicket = mongoose.model<IQueueTicket>(
  "QueueTicket",
  QueueTicketSchema
);
