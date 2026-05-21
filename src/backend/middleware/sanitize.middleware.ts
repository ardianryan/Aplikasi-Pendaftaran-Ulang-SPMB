import type { Context, Next } from "hono";

/**
 * Recursively sanitizes input data to prevent:
 * 1. NoSQL Injection: Strips keys starting with "$" or containing "."
 * 2. Cross-Site Scripting (XSS): Strips HTML tags from string values
 */
export function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    let sanitized = data;
    // Strip <script>...</script> (case-insensitive)
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    // Strip other dangerous HTML tags like <iframe>, <object>, <embed>, <applet>, <meta>, <link>, <style>
    sanitized = sanitized.replace(/<(iframe|object|embed|applet|meta|link|style)\b[^>]*>([\s\S]*?)<\/\1>/gi, "");
    // Strip any remaining HTML tags to ensure clean textual values
    sanitized = sanitized.replace(/<[^>]*>/g, "");
    return sanitized.trim();
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === "object") {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Prevent NoSQL Injection: completely ignore keys starting with $ or containing .
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      sanitizedObj[key] = sanitizeData(value);
    }
    return sanitizedObj;
  }

  return data;
}

/**
 * Global Hono middleware that intercepts and wraps c.req.json() to return sanitized data.
 */
export async function sanitizeBody(c: Context, next: Next) {
  const contentType = c.req.header("content-type");
  if (contentType && contentType.includes("application/json")) {
    const originalJson = c.req.json.bind(c.req);
    let cachedSanitized: any = null;

    // Override the default c.req.json method dynamically
    c.req.json = async () => {
      if (cachedSanitized) return cachedSanitized;
      try {
        const raw = await originalJson();
        cachedSanitized = sanitizeData(raw);
        return cachedSanitized;
      } catch (err) {
        // Re-throw JSON parse errors so validation/error middlewares can handle them
        throw err;
      }
    };
  }
  await next();
}
