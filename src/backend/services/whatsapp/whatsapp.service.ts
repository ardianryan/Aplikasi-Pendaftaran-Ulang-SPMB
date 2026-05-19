/**
 * WhatsApp Service - Abstract Interface & Factory
 * Adapter pattern: swap between GOWA / HonoWA without changing business logic.
 * Connection config is stored in MongoDB settings, NOT in .env.
 */

import { Setting } from "../../models/Setting";
import { GowaAdapter } from "./gowa.adapter";
import { HonowaAdapter } from "./honowa.adapter";

// ============================================
// Interfaces
// ============================================

export interface WASendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WAConnectionStatus {
  connected: boolean;
  deviceId?: string;
  pushName?: string;
}

export interface WhatsAppAdapter {
  /** Check gateway connection status */
  getStatus(): Promise<WAConnectionStatus>;

  /** Send a text message to a single phone number */
  sendMessage(phone: string, message: string): Promise<WASendResult>;

  /** Check if a phone number is registered on WhatsApp (if supported) */
  checkNumber(phone: string): Promise<boolean>;

  /** Provider name for display purposes */
  readonly providerName: string;
}

// ============================================
// Factory
// ============================================

export async function createWhatsAppAdapter(): Promise<WhatsAppAdapter | null> {
  const waSettings = await Setting.find({
    key: { $in: [
      "wa_gateway_enabled",
      "wa_gateway_provider",
      "wa_gateway_url",
      "wa_gateway_auth_user",
      "wa_gateway_auth_pass",
      "wa_gateway_device_id",
    ] },
  }).lean();

  const map: Record<string, any> = {};
  for (const s of waSettings) {
    map[s.key] = s.value;
  }

  // Master switch
  if (map.wa_gateway_enabled !== true && map.wa_gateway_enabled !== "true") {
    return null;
  }

  const url = (map.wa_gateway_url || "").trim();
  if (!url) return null;

  const provider = (map.wa_gateway_provider || "gowa").trim();
  const authUser = (map.wa_gateway_auth_user || "").trim();
  const authPass = (map.wa_gateway_auth_pass || "").trim();
  const deviceId = (map.wa_gateway_device_id || "").trim();

  switch (provider) {
    case "gowa":
      return new GowaAdapter(url, authUser, authPass, deviceId);
    case "honowa":
      return new HonowaAdapter(url, authPass, deviceId);
    default:
      return new GowaAdapter(url, authUser, authPass, deviceId);
  }
}

// ============================================
// Template variable replacer
// ============================================

export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "");
  }
  return result;
}

// ============================================
// Phone number normalizer (shared)
// ============================================

export function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}
