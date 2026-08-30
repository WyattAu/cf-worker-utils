export interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimiterBackend {
  get(key: string): Promise<Bucket | undefined>;
  set(key: string, bucket: Bucket): Promise<void>;
  increment(key: string, windowMs: number): Promise<Bucket>;
}

export class InMemoryBackend implements RateLimiterBackend {
  private store = new Map<string, Bucket>();

  async get(key: string): Promise<Bucket | undefined> {
    const bucket = this.store.get(key);
    if (bucket && Date.now() > bucket.resetAt) {
      this.store.delete(key);
      return undefined;
    }
    return bucket;
  }

  async set(key: string, bucket: Bucket): Promise<void> {
    this.store.set(key, bucket);
  }

  async increment(key: string, windowMs: number): Promise<Bucket> {
    const existing = await this.get(key);
    if (existing) {
      existing.count++;
      await this.set(key, existing);
      return existing;
    }

    const bucket: Bucket = { count: 1, resetAt: Date.now() + windowMs };
    await this.set(key, bucket);
    return bucket;
  }
}

export interface KVBackendOptions {
  kv: KVNamespace;
  prefix?: string;
}

export class KVBackend implements RateLimiterBackend {
  private kv: KVNamespace;
  private prefix: string;

  constructor(options: KVBackendOptions) {
    this.kv = options.kv;
    this.prefix = options.prefix ?? "rl:";
  }

  async get(key: string): Promise<Bucket | undefined> {
    const data = await this.kv.get<Bucket>(this.prefix + key, "json");
    if (data && Date.now() > data.resetAt) {
      await this.kv.delete(this.prefix + key);
      return undefined;
    }
    return data ?? undefined;
  }

  async set(key: string, bucket: Bucket): Promise<void> {
    const ttlSeconds = Math.ceil((bucket.resetAt - Date.now()) / 1000);
    await this.kv.put(this.prefix + key, JSON.stringify(bucket), {
      expirationTtl: Math.max(ttlSeconds, 1),
    });
  }

  async increment(key: string, windowMs: number): Promise<Bucket> {
    const existing = await this.get(key);
    if (existing) {
      existing.count++;
      await this.set(key, existing);
      return existing;
    }

    const bucket: Bucket = { count: 1, resetAt: Date.now() + windowMs };
    await this.set(key, bucket);
    return bucket;
  }
}

export class RateLimiter {
  private backend: RateLimiterBackend;
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions, backend?: RateLimiterBackend) {
    this.options = options;
    this.backend = backend ?? new InMemoryBackend();
  }

  async check(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const bucket = await this.backend.increment(key, this.options.windowMs);
    const allowed = bucket.count <= this.options.limit;
    const remaining = Math.max(0, this.options.limit - bucket.count);

    return { allowed, remaining, resetAt: bucket.resetAt };
  }
}
