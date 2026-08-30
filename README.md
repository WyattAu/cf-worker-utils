# @wyatt/cf-worker-utils

Cloudflare Workers utilities — SWR cache, circuit breaker, rate limiter, security headers, and structured logging.

## Installation

```bash
npm install @wyatt/cf-worker-utils
```

## Usage

### SWR Cache (Stale-While-Revalidate)

```ts
import { SWRCache } from "@wyatt/cf-worker-utils";

const cache = new SWRCache({ ttl: 60_000, staleWhileRevalidate: 30_000 });

// Set a value
cache.set("user:123", { name: "Alice" });

// Get a value — returns { value, stale } or undefined
const hit = cache.get("user:123");
if (hit) {
  if (hit.stale) {
    // Serve stale data and revalidate in the background
  }
}
```

### Circuit Breaker

```ts
import { CircuitBreaker } from "@wyatt/cf-worker-utils";

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30_000,
});

try {
  const result = await breaker.execute(() => fetch("https://api.example.com"));
} catch (error) {
  if (error instanceof CircuitOpenError) {
    // Circuit is open — return fallback
  }
}
```

### Rate Limiter

```ts
import { RateLimiter, InMemoryBackend } from "@wyatt/cf-worker-utils";

const limiter = new RateLimiter(
  { limit: 100, windowMs: 60_000 },
  new InMemoryBackend(),
);

const result = await limiter.check("ip:1.2.3.4");
if (!result.allowed) {
  return new Response("Too Many Requests", { status: 429 });
}
```

### Security Headers

```ts
import { securityHeaders } from "@wyatt/cf-worker-utils";

const headers = securityHeaders();
return new Response("OK", { headers });
```

### Structured Logger

```ts
import { Logger } from "@wyatt/cf-worker-utils";

const logger = new Logger({ level: "info" });

logger.info("Request received", { method: "GET", path: "/api/data" });
logger.error("Upstream failed", { status: 502 });
```

### JSON Response

```ts
import { jsonResponse, jsonErrorResponse } from "@wyatt/cf-worker-utils";

return jsonResponse({ data: "ok" });
return jsonErrorResponse("Not Found", 404);
```

## License

MIT OR Apache-2.0
