/**
 * HonoWA Adapter — Hono-WA REST API
 * https://github.com/elianhardyy/hono-wa-web-multidevice
 *
 * Auth: API Key via X-API-Key header or Authorization: Bearer <KEY>
 * Session: identified by sessionId in URL path
 * Send: POST /send/:sessionId  { phone, message }
 * Status: GET /sessions
 */

import type {
  WhatsAppAdapter,
  WASendResult,
  WAConnectionStatus,
} from "./whatsapp.service";
import { normalizePhone } from "./whatsapp.service";

export class HonowaAdapter implements WhatsAppAdapter {
  readonly providerName = "HonoWA";

  constructor(
    private baseUrl: string,
    private apiKey: string,
    private sessionId: string
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      h["X-API-Key"] = this.apiKey;
    }
    return h;
  }

  async getStatus(): Promise<WAConnectionStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/sessions`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json() as any;

      // Find the session matching our sessionId
      const sessions = data.data || data.sessions || [];
      const session = Array.isArray(sessions)
        ? sessions.find((s: any) => s.id === this.sessionId || s.name === this.sessionId)
        : null;

      return {
        connected: session?.status === "CONNECTED" || session?.isConnected === true,
        deviceId: session?.id || this.sessionId,
      };
    } catch {
      return { connected: false };
    }
  }

  async sendMessage(phone: string, message: string): Promise<WASendResult> {
    try {
      const normalized = normalizePhone(phone);
      const res = await fetch(`${this.baseUrl}/send/${this.sessionId}`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ phone: normalized, message }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json() as any;
      return {
        success: data.success === true || data.status === true,
        messageId: data.data?.messageId || data.messageId,
        error: !data.success && !data.status ? (data.message || "HonoWA send failed") : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "HonoWA request failed",
      };
    }
  }

  async checkNumber(_phone: string): Promise<boolean> {
    // HonoWA does not have a user check endpoint
    // Assume all numbers are valid
    return true;
  }
}
