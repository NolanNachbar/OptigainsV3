// Request deduplication utility to prevent duplicate API calls
// Caches promises for in-flight requests and returns the same promise for duplicate requests

interface CacheEntry {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTimeout: number = 5000; // 5 seconds default

  constructor(cacheTimeout?: number) {
    if (cacheTimeout) {
      this.cacheTimeout = cacheTimeout;
    }
  }

  /**
   * Deduplicates requests by caching promises for in-flight requests
   * @param key Unique key for the request
   * @param requestFn Function that returns a promise for the request
   * @returns Promise that resolves to the request result
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Clean up expired entries
    this.cleanupExpiredEntries();

    // Check if we have a cached promise for this key
    const cached = this.cache.get(key);
    if (cached) {
      return cached.promise as Promise<T>;
    }

    // Create new promise and cache it
    const promise = requestFn()
      .then((result) => {
        // Keep successful results in cache for a bit
        return result;
      })
      .catch((error) => {
        // Remove failed requests from cache immediately
        this.cache.delete(key);
        throw error;
      })
      .finally(() => {
        // Schedule removal after timeout
        setTimeout(() => {
          this.cache.delete(key);
        }, this.cacheTimeout);
      });

    this.cache.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Removes a specific key from the cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Removes entries older than the cache timeout
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheTimeout) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

// Create singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Helper function to create request keys
export function createRequestKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.map(p => 
    typeof p === 'object' ? JSON.stringify(p) : String(p)
  ).join(':')}`;
}