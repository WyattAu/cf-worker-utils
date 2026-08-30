import { securityHeaders, mergeWithSecurityHeaders } from "./security-headers.js";

export interface JsonResponseOptions {
  status?: number;
  headers?: HeadersInit;
}

export function jsonResponse(
  body: unknown,
  options?: JsonResponseOptions,
): Response {
  const status = options?.status ?? 200;
  const headers = mergeWithSecurityHeaders(options?.headers ?? {}, {
    csp: "default-src 'self'",
  });
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

export function jsonErrorResponse(
  message: string,
  status: number,
  meta?: Record<string, unknown>,
): Response {
  return jsonResponse({ error: message, ...meta }, { status });
}
