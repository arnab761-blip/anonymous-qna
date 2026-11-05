/**
 * Lightweight In-Memory TTL Cache
 * Ideal for short-lived (10-15s) Feed caching to reduce read hits on MongoDB Atlas M0.
 */
class MemoryCache {
  constructor(defaultTtlSeconds = 15) {
    this.cache = new Map();
    this.defaultTtl = defaultTtlSeconds * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, ttlSeconds) {
    const ttl = (ttlSeconds ? ttlSeconds * 1000 : this.defaultTtl);
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  delete(key) {
    this.cache.delete(key);
  }

  // Clear all feed caches (e.g. when a new question is posted)
  clear() {
    this.cache.clear();
  }
}

// Global singleton instance for Feed caching (default TTL: 15 seconds)
const feedCache = new MemoryCache(15);

module.exports = feedCache;
