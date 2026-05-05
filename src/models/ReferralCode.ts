/**
 * ReferralCode Model - MongoDB Schema
 * Manages operator registration codes (prefix + suffix system)
 * 
 * Admin creates a prefix (e.g., "U240512005") with max 99 slots.
 * Each slot (e.g., "U240512005-1") can only be used once.
 * Guru/tendik uses the full code to register as operator.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IUsedSlot {
  suffix: number; // 1-99
  usedBy: mongoose.Types.ObjectId; // Admin who used this slot
  usedAt: Date;
  googleEmail: string;
}

export interface IReferralCode extends Document {
  prefix: string; // e.g., "U240512005"
  label: string; // Description, e.g., "Batch Mei 2025"
  maxSlots: number; // Default 99
  usedSlots: IUsedSlot[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UsedSlotSchema = new Schema(
  {
    suffix: { type: Number, required: true },
    usedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    usedAt: { type: Date, default: Date.now },
    googleEmail: { type: String, required: true },
  },
  { _id: false }
);

const ReferralCodeSchema = new Schema<IReferralCode>(
  {
    prefix: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    maxSlots: {
      type: Number,
      default: 99,
      min: 1,
      max: 99,
    },
    usedSlots: {
      type: [UsedSlotSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "referral_codes",
  }
);

// Index for quick lookup
ReferralCodeSchema.index({ prefix: 1 });
ReferralCodeSchema.index({ isActive: 1 });

export const ReferralCode = mongoose.model<IReferralCode>("ReferralCode", ReferralCodeSchema);
