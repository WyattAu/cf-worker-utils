export interface SecurityHeaderOptions {
  /** Custom Content-Security-Policy directive. */
  csp?: string;
  /** Whether to set X-Content-Type-Options. Defaults to true. */
  contentTypeOptions?: boolean;
  /** Custom X-Frame-Options value. Defaults to DENY. */
  frameOptions?: string;
  /** Custom Referrer-Policy value. Defaults to strict-origin-when-cross-origin. */
  referrerPolicy?: string;
}

export function securityHeaders(options?: SecurityHeaderOptions): Record<string, string> {
  const opts = options ?? {};
  return {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy":
      opts.csp ?? "default-src 'self'",
    "X-Content-Type-Options": opts.contentTypeOptions === false ? "" : "nosniff",
    "X-Frame-Options": opts.frameOptions ?? "DENY",
    "Referrer-Policy": opts.referrerPolicy ?? "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "1; mode=block",
  };
}

export function mergeWithSecurityHeaders(
  existing: HeadersInit,
  options?: SecurityHeaderOptions,
): Headers {
  const headers = new Headers(existing);
  const sec = securityHeaders(options);

  for (const [key, value] of Object.entries(sec)) {
    if (value && !headers.has(key)) {
      headers.set(key, value);
    }
  }

  return headers;
}
