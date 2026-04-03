// Simple in-memory cache - Redis ছাড়াই কাজ করে
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set cache with TTL (seconds)
  set(key, value, ttl = 300) {
    // default 5 min
    // Clear old timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });

    // Auto delete after TTL
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);
  }

  // Get from cache
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    return item.data;
  }

  // Delete specific key
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  // Delete by pattern (wildcard)
  deletePattern(pattern) {
    const regex = new RegExp(pattern.replace("*", ".*"));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
      }
    }
  }

  // Clear all
  clear() {
    this.cache.clear();
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  // Get stats
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

module.exports = new MemoryCache();
