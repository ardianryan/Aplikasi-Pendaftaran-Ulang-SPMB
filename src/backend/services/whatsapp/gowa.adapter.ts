/**
 * GOWA Adapter — Go-WhatsApp REST API
 * https://github.com/aldinokemal/go-whatsapp-web-multidevice
 *
 * Auth: Basic Auth (username:password)
 * Device scoping: X-Device-Id header (v8 multi-device)
 * Send: POST /send/message  { phone, message }
 * Status: GET /app/status
 * Check: GET /user/check?phone=...
 */

import type {
  WhatsAppAdapter,
  WASendResult,
  WAConnectionStatus,
} from "./whatsapp.service";
import { normalizePhone } from "./whatsapp.service";

export class GowaAdapter implements WhatsAppAdapter {
  readonly providerName = "GOWA";

  constructor(
    private baseUrl: string,
    private authUser: string,
    private authPass: string,
    private deviceId: string
  ) {
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.authUser && this.authPass) {
      const encoded = Buffer.from(
        `${this.authUser}:${this.authPass}`
      ).toString("base64");
      h["Authorization"] = `Basic ${encoded}`;
    }
    if (this.deviceId) {
      h["X-Device-Id"] = this.deviceId;
    }
    return h;
  }

  async getStatus(): Promise<WAConnectionStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/app/status`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json() as any;
      return {
        connected:
          data.results?.is_connected === true &&
          data.results?.is_logged_in === true,
        deviceId: data.results?.device_id || this.deviceId,
      };
    } catch {
      return { connected: false };
    }
  }

  async sendMessage(phone: string, message: string): Promise<WASendResult> {
    try {
      const normalized = normalizePhone(phone) + "@s.whatsapp.net";
      const res = await fetch(`${this.baseUrl}/send/message`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ phone: normalized, message }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json() as any;
      return {
        success: data.code === "SUCCESS",
        messageId: data.results?.message_id,
        error: data.code !== "SUCCESS" ? data.message : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "GOWA request failed",
      };
    }
  }

  async checkNumber(phone: string): Promise<boolean> {
    try {
      const normalized = normalizePhone(phone);
      const res = await fetch(
        `${this.baseUrl}/user/check?phone=${normalized}`,
        {
          headers: this.headers(),
          signal: AbortSignal.timeout(8000),
        }
      );
      const data = await res.json() as any;
      return data.results?.is_registered === true;
    } catch {
      return false;
    }
  }
}
