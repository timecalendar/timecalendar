export interface LruCache<K, V> {
  /** The cached value for `key`, building and inserting it on a miss. */
  getOrCreate(key: K, build: () => V): V
  has(key: K): boolean
  readonly size: number
  clear(): void
}

/** A Map-backed LRU; insertion order is recency. */
export function createLruCache<K, V>(capacity: number): LruCache<K, V> {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new RangeError("capacity must be a positive integer")
  }
  const entries = new Map<K, V>()
  return {
    getOrCreate(key, build) {
      if (entries.has(key)) {
        const hit = entries.get(key) as V
        entries.delete(key)
        entries.set(key, hit)
        return hit
      }
      const value = build()
      entries.set(key, value)
      if (entries.size > capacity) {
        entries.delete(entries.keys().next().value as K)
      }
      return value
    },
    has: (key) => entries.has(key),
    get size() {
      return entries.size
    },
    clear: () => entries.clear(),
  }
}
