/**
 * Queue SSE (Server-Sent Events) Engine
 * Pub-sub broadcaster untuk update real-time ke semua klien display antrian.
 * Menggunakan in-memory Set — stateless per-request, tidak butuh library tambahan.
 */

import { streamSSE } from "hono/streaming";

// ============================================
// Types
// ============================================

export type QueueEventType =
  | "call"
  | "done"
  | "skip"
  | "session_start"
  | "session_end"
  | "status_update"
  | "ping";

export interface QueueEvent {
  type: QueueEventType;
  data: Record<string, any>;
}

type SSEWriter = {
  id: string;
  send: (event: QueueEvent) => Promise<void>;
  abort: () => void;
};

// ============================================
// In-Memory Client Registry
// ============================================

const clients = new Map<string, SSEWriter>();

export function addSSEClient(writer: SSEWriter): void {
  clients.set(writer.id, writer);
  console.log(`[SSE] Client connected: ${writer.id} | Total: ${clients.size}`);
}

export function removeSSEClient(id: string): void {
  clients.delete(id);
  console.log(`[SSE] Client disconnected: ${id} | Total: ${clients.size}`);
}

/**
 * Broadcast event ke semua klien SSE yang terhubung.
 * Error pada satu klien tidak mempengaruhi klien lain.
 */
export async function broadcastQueueEvent(event: QueueEvent): Promise<void> {
  const deadClients: string[] = [];

  for (const [id, writer] of clients.entries()) {
    try {
      await writer.send(event);
    } catch {
      deadClients.push(id);
    }
  }

  // Cleanup dead connections
  for (const id of deadClients) {
    clients.delete(id);
    console.log(`[SSE] Removed dead client: ${id}`);
  }
}

/**
 * Heartbeat ping setiap 25 detik untuk mencegah timeout idle
 * pada proxy/nginx dan browser.
 */
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(): void {
  if (heartbeatInterval) return; // Sudah berjalan
  heartbeatInterval = setInterval(async () => {
    if (clients.size > 0) {
      await broadcastQueueEvent({
        type: "ping",
        data: { ts: Date.now() },
      });
    }
  }, 25000);
  console.log("[SSE] Heartbeat started (25s interval)");
}

export function getClientCount(): number {
  return clients.size;
}

export { streamSSE };
