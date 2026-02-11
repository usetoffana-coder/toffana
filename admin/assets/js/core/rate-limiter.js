/**
 * RateLimiter - client side throttle
 */
const RateLimiter = {
  storageKey: 'rate_limits_v1',
  memory: {},
  storage: 'local',

  load() {
    try {
      const store = this.storage === 'session' ? sessionStorage : localStorage;
      const raw = store.getItem(this.storageKey);
      if (raw) this.memory = JSON.parse(raw) || {};
    } catch (e) {
      this.memory = {};
    }
  },

  save() {
    try {
      const store = this.storage === 'session' ? sessionStorage : localStorage;
      store.setItem(this.storageKey, JSON.stringify(this.memory));
    } catch (e) {
      // ignore
    }
  },

  /**
   * @param {string} key
   * @param {number} max
   * @param {number} windowMs
   * @returns {boolean}
   */
  allow(key, max, windowMs) {
    const now = Date.now();
    const entry = this.memory[key] || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    if (entry.count >= max) {
      this.memory[key] = entry;
      this.save();
      return false;
    }

    entry.count += 1;
    this.memory[key] = entry;
    this.save();
    return true;
  }
  ,
  /**
   * Token bucket simples
   * @param {string} key
   * @param {number} capacity
   * @param {number} refillRatePerSec
   * @returns {boolean}
   */
  allowBucket(key, capacity, refillRatePerSec) {
    const now = Date.now();
    const entry = this.memory[key] || { tokens: capacity, lastRefill: now };

    const elapsedSec = Math.max(0, (now - entry.lastRefill) / 1000);
    const refill = elapsedSec * refillRatePerSec;
    entry.tokens = Math.min(capacity, entry.tokens + refill);
    entry.lastRefill = now;

    if (entry.tokens < 1) {
      this.memory[key] = entry;
      this.save();
      return false;
    }

    entry.tokens -= 1;
    this.memory[key] = entry;
    this.save();
    return true;
  }
};

RateLimiter.load();
window.RateLimiter = RateLimiter;
