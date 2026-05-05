/**
 * Generic Validation Middleware
 * Uses Zod schemas to validate request bodies
 */

import type { Context, Next } from "hono";
import type { ZodSchema } from "zod";
import { validationError } from "../utils/response";

/**
 * Creates a middleware that validates the request body against a Zod schema
 * Usage: app.post("/route", validate(mySchema), handler)
 */
export function validate(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        return validationError(
          c,
          result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          }))
        );
      }

      // Store validated data in context for controller access
      c.set("validatedBody" as any, result.data);
      await next();
    } catch (err: any) {
      // Handle JSON parse errors
      if (err.message?.includes("JSON")) {
        return validationError(c, [
          { field: "body", message: "Request body harus berupa JSON yang valid" },
        ]);
      }
      throw err;
    }
  };
}
