'use strict';

class TokenBucketLimiter {
  constructor(qps, burst = 1) {
    this.capacity = Math.max(1, burst);
    this.tokens = this.capacity;
    this.refillPerMs = Math.max(0.001, qps) / 1000;
    this.last = Date.now();
  }

  tryRemoveToken() {
    const now = Date.now();
    const elapsed = Math.max(0, now - this.last);
    this.last = now;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

module.exports = { TokenBucketLimiter };


