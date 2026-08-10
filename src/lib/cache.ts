/**
 * Lightweight in-memory TTL cache.
 *
 * In a multi-instance Zerops deployment this layer would be backed by Valkey
 * (shared across the api + worker). Inside this single Next.js process a
 * module-level Map gives us the same rate-limit-friendly behavior and lets the
 * UI honestly report "cached" vs "fresh".
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

const DEFAULT_TTL_MS = 60_000; // 60s — rate-limit friendly

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  store.set(key, { value, expiresAt: now + ttlMs, storedAt: now });
}

export function invalidate(key: string) {
  store.delete(key);
}

/** Age of a cached entry in seconds, or null if not cached. */
export function cacheAgeSeconds(key: string): number | null {
  const entry = store.get(key);
  if (!entry) return null;
  return Math.round((Date.now() - entry.storedAt) / 1000);
}
