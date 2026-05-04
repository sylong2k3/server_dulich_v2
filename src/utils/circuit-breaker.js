/**
 * HIGH-09: Circuit Breaker Pattern for external service calls
 *
 * Prevents cascading failures when external services (FCM, APNS, ...) are degraded.
 * States: CLOSED (normal) → OPEN (failing, reject fast) → HALF-OPEN (probe)
 *
 * Usage:
 *   const fcmBreaker = createCircuitBreaker('fcm', { failureThreshold: 5 });
 *   const result = await fcmBreaker.exec(() => sendPush(payload));
 */

class CircuitBreaker {
  /**
   * @param {string} name - Tên service (logging)
   * @param {object} options
   * @param {number} options.failureThreshold - Số lần fail trước khi mở circuit (default: 5)
   * @param {number} options.resetTimeMs - Thời gian chờ trước khi thử lại (default: 30s)
   * @param {number} options.timeoutMs - Timeout cho mỗi request (default: 10s)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeMs = options.resetTimeMs || 30000;
    this.timeoutMs = options.timeoutMs || 10000;

    this.state = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  /**
   * Thực thi function qua circuit breaker
   * @param {Function} fn - Async function cần bảo vệ
   * @returns {Promise} Kết quả từ fn
   * @throws {Error} CircuitOpenError nếu circuit đang mở
   */
  async exec(fn) {
    if (this.state === 'OPEN') {
      // Kiểm tra có nên chuyển sang HALF_OPEN không
      if (Date.now() - this.lastFailureTime >= this.resetTimeMs) {
        this.state = 'HALF_OPEN';
        console.log(`[CircuitBreaker:${this.name}] OPEN → HALF_OPEN (probing)`);
      } else {
        const err = new Error(`Circuit breaker OPEN for ${this.name}`);
        err.code = 'CIRCUIT_OPEN';
        throw err;
      }
    }

    try {
      const result = await this._withTimeout(fn);
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  /**
   * Thực thi với timeout
   */
  async _withTimeout(fn) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`[CircuitBreaker:${this.name}] Timeout after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  _onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      // Cần 2 success liên tiếp để đóng circuit
      if (this.successCount >= 2) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] HALF_OPEN → CLOSED (recovered)`);
      }
    } else {
      this.failureCount = 0;
    }
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold && this.state !== 'OPEN') {
      this.state = 'OPEN';
      console.error(
        `[CircuitBreaker:${this.name}] CLOSED → OPEN after ${this.failureCount} failures`
      );
    }
  }

  /**
   * Trạng thái hiện tại (cho health check)
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// ─── Pre-configured breakers for known external services ────────────

const breakers = {};

const createCircuitBreaker = (name, options = {}) => {
  if (!breakers[name]) {
    breakers[name] = new CircuitBreaker(name, options);
  }
  return breakers[name];
};

const getAllBreakersStatus = () => {
  return Object.values(breakers).map((b) => b.getStatus());
};

module.exports = {
  CircuitBreaker,
  createCircuitBreaker,
  getAllBreakersStatus,
};
