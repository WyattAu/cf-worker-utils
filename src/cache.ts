interface CacheEntry<T> {
  value: T;
  staleAt: number;
  expiresAt: number;
}

export interface SWROptions {
  /** Time-to-live in milliseconds. */
  ttl: number;
  /** Time after TTL before entry is considered stale, in milliseconds. */
  staleWhileRevalidate?: number;
}

export class SWRCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private options: Required<SWROptions>;

  constructor(options: SWROptions) {
    this.options = {
      ttl: options.ttl,
      staleWhileRevalidate: options.staleWhileRevalidate ?? options.ttl,
    };
  }

  get<T = unknown>(key: string): { value: T; stale: boolean } | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    if (now > entry.staleAt) {
      return { value: entry.stale, stale: true } as unknown as {
        value: T;
        stale: boolean;
      };
    }

    return { value: entry.value, stale: false };
  }

  set<T = unknown>(key: string, value: T): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      staleAt: now + this.options.ttl,
      expiresAt: now + this.options.ttl + this.options.staleWhileRevalidate,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
