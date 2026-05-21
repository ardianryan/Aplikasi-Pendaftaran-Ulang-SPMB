/**
 * Cloudflare R2 Configuration (S3-compatible)
 * Used for storing uploaded documents (KK, Ijazah, Akta, Foto)
 */

import { S3Client } from "@aws-sdk/client-s3";
import { Setting } from "../models/Setting";

let r2Client: S3Client | null = null;
let lastConfig: {
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
} | null = null;

/**
 * Get or create the R2 S3Client instance (singleton)
 */
export async function getR2Client(): Promise<S3Client> {
  const settings = await Setting.find({
    key: { $in: ["r2_endpoint", "r2_access_key_id", "r2_secret_access_key", "r2_region"] }
  }).lean();

  const configMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, any>);

  const endpoint = configMap.r2_endpoint;
  const accessKeyId = configMap.r2_access_key_id;
  const secretAccessKey = configMap.r2_secret_access_key;
  const region = configMap.r2_region || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Konfigurasi Cloudflare R2 belum lengkap di Pengaturan Portal."
    );
  }

  // Check if configuration has changed since last client creation
  const isChanged = !lastConfig ||
    lastConfig.endpoint !== endpoint ||
    lastConfig.accessKeyId !== accessKeyId ||
    lastConfig.secretAccessKey !== secretAccessKey ||
    lastConfig.region !== region;

  if (isChanged || !r2Client) {
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
    lastConfig = { endpoint, accessKeyId, secretAccessKey, region };
  }

  return r2Client;
}

/**
 * Get the R2 bucket name from settings
 */
export async function getR2Bucket(): Promise<string> {
  const s = await Setting.findOne({ key: "r2_bucket" }).lean();
  const bucket = s?.value;
  if (!bucket) {
    throw new Error("Kunci 'r2_bucket' belum diatur di Pengaturan Portal.");
  }
  return bucket;
}

/**
 * Get the R2 prefix (directory path) for uploads from settings
 */
export async function getR2Prefix(): Promise<string> {
  const s = await Setting.findOne({ key: "r2_prefix" }).lean();
  return s?.value !== undefined ? s.value : "uploads/";
}

/**
 * Get the public URL base for accessing uploaded files from settings
 */
export async function getR2PublicUrl(): Promise<string> {
  const s = await Setting.findOne({ key: "r2_public_url" }).lean();
  return s?.value || "";
}
