/**
 * Admin Model - MongoDB Schema
 * For operator/admin users who manage the registration portal
 * Supports both local auth (username/password) and SSO (Google OAuth via ScholarGate)
 */

import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { ADMIN_ROLES } from "../config/constants";

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  nama: string;
  role: "admin" | "operator";
  isActive: boolean;
  lastLogin: Date | null;

  // SSO / Google OAuth fields
  ssoId: string | null; // ScholarGate member ID
  googleEmail: string | null; // Google email for OAuth matching
  googleAvatar: string | null; // Profile picture URL
  nip: string | null; // NIP guru/tendik
  authMethod: "local" | "google"; // How this user authenticates

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
    },
    passwordHash: {
      type: String,
      default: "", // Empty for SSO-only users
    },
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ADMIN_ROLES,
      default: "operator",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },

    // SSO fields
    ssoId: {
      type: String,
      default: null,
      sparse: true, // Allow null but unique when set
    },
    googleEmail: {
      type: String,
      default: null,
      sparse: true,
    },
    googleAvatar: {
      type: String,
      default: null,
    },
    nip: {
      type: String,
      default: null,
    },
    authMethod: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  {
    timestamps: true,
    collection: "admins",
  }
);

// ============================================
// Instance Methods
// ============================================

/**
 * Compare a candidate password with the stored hash
 */
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ============================================
// Static Methods / Pre-save Hooks
// ============================================

/**
 * Hash password before saving (only if modified and not empty)
 */
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Don't return passwordHash in JSON responses
AdminSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.passwordHash = undefined;
    return ret;
  },
});

export const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
