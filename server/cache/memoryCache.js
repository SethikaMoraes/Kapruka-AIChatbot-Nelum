/**
 * Nelum Express Server In-Memory Cache Layer
 */
const cache = new Map();

export const memoryCache = {
  /**
   * Retrieves a cached value if it exists and is not expired.
   * @param {string} key 
   * @returns {any|null}
   */
  getCached(key) {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      cache.delete(key);
      return null;
    }
    return cached.value;
  },

  /**
   * Stores a value in the cache with a specified TTL.
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds 
   */
  setCached(key, value, ttlSeconds) {
    cache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  },

  /**
   * Clears the cache contents.
   */
  clear() {
    cache.clear();
  }
};

export default memoryCache;
