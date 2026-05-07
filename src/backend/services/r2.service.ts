/**
 * R2 Storage Service
 * Handles file upload, deletion, and URL generation for Cloudflare R2
 */

import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getR2Client, getR2Bucket, getR2Prefix, getR2PublicUrl } from "../config/r2";
import type { DocumentType } from "../config/constants";

// ============================================
// Types
// ============================================

interface UploadResult {
  key: string;
  publicUrl: string;
  size: number;
  mimeType: string;
}

// ============================================
// Upload File to R2
// ============================================

/**
 * Upload a file buffer to Cloudflare R2
 * @param nisn - Student NISN (used as folder name)
 * @param docType - Document type (kartuKeluarga, ijazahSkl, etc.)
 * @param buffer - File content as Buffer/Uint8Array
 * @param mimeType - MIME type of the file
 * @param originalName - Original filename (for extension extraction)
 */
export async function uploadToR2(
  nisn: string,
  docType: DocumentType,
  buffer: Buffer | Uint8Array,
  mimeType: string,
  originalName: string
): Promise<UploadResult> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  const prefix = getR2Prefix();

  // Extract file extension from original name
  const ext = originalName.split(".").pop()?.toLowerCase() || "pdf";

  // Build the object key: uploads/smansage/akas/{nisn}/{docType}.{ext}
  const key = `${prefix}${nisn}/${docType}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    // Set cache control for public access
    CacheControl: "public, max-age=31536000",
  });

  await client.send(command);

  const publicUrl = getPublicUrl(key);

  return {
    key,
    publicUrl,
    size: buffer.length,
    mimeType,
  };
}

// ============================================
// Delete File from R2
// ============================================

/**
 * Delete a file from Cloudflare R2
 * @param key - The full object key to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

// ============================================
// Check if File Exists
// ============================================

/**
 * Check if a file exists in R2
 * @param key - The full object key to check
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Get Public URL
// ============================================

/**
 * Construct the public URL for an uploaded file
 * @param key - The R2 object key
 */
export function getPublicUrl(key: string): string {
  const baseUrl = getR2PublicUrl();
  if (!baseUrl) {
    // If no public URL configured, return the key as-is
    return key;
  }
  // Remove trailing slash from base URL
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/${key}`;
}
