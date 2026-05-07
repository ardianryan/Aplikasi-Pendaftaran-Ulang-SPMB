/**
 * Cloudflare R2 Configuration (S3-compatible)
 * Used for storing uploaded documents (KK, Ijazah, Akta, Foto)
 */

import { S3Client } from "@aws-sdk/client-s3";

let r2Client: S3Client | null = null;

/**
 * Get or create the R2 S3Client instance (singleton)
 */
export function getR2Client(): S3Client {
  if (!r2Client) {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const region = process.env.R2_REGION || "auto";

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 configuration incomplete. Check R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env"
      );
    }

    r2Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Required for R2 compatibility
      forcePathStyle: true,
    });
  }

  return r2Client;
}

/**
 * Get the R2 bucket name from environment
 */
export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2_BUCKET environment variable is not set");
  }
  return bucket;
}

/**
 * Get the R2 prefix (directory path) for uploads
 */
export function getR2Prefix(): string {
  // If undefined, default to 'uploads/'. If user intentionally sets to empty string, use empty string.
  return process.env.R2_PREFIX !== undefined ? process.env.R2_PREFIX : "uploads/";
}

/**
 * Get the public URL base for accessing uploaded files
 */
export function getR2PublicUrl(): string {
  return process.env.R2_PUBLIC_URL || "";
}
