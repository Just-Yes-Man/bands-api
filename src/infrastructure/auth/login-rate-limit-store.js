const env = require('../config/env');

class LoginRateLimitStore {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 5;
    this.windowMs = options.windowMs || env.LOGIN_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000;
    this.store = new Map();
  }

  getKey(identifier, ip) {
    return `${identifier}|${ip || 'unknown'}`;
  }

  consume(identifier, ip) {
    const now = Date.now();
    const key = this.getKey(identifier, ip);
    const current = this.store.get(key);

    if (!current || current.windowEnd <= now) {
      const next = { attempts: 1, windowStart: now, windowEnd: now + this.windowMs };
      this.store.set(key, next);
      return { allowed: true, remaining: this.maxAttempts - 1, resetAt: next.windowEnd };
    }

    current.attempts += 1;
    this.store.set(key, current);

    if (current.attempts > this.maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: current.windowEnd };
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.maxAttempts - current.attempts),
      resetAt: current.windowEnd
    };
  }

  reset(identifier, ip) {
    this.store.delete(this.getKey(identifier, ip));
  }
}

module.exports = {
  LoginRateLimitStore
};
