class TaskQueue {
  constructor(concurrency = 3, timeoutMs = 20000) {
    this.concurrency = concurrency;
    this.timeoutMs = timeoutMs;
    this.running = 0;
    this.queue = [];
  }

  /**
   * Chạy một async function thông qua hàng đợi với giới hạn concurrency và timeout.
   * @param {Function} fn - Async function cần thực thi
   * @returns {Promise<any>}
   */
  async run(fn) {
    return new Promise((resolve, reject) => {
      let isTimedOut = false;
      
      const timer = setTimeout(() => {
        isTimedOut = true;
        // Loại bỏ task khỏi hàng đợi nếu nó chưa được chạy
        const index = this.queue.findIndex(item => item.reject === reject);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        const err = new Error(`Yêu cầu bị quá tải và hết thời gian chờ trong hàng đợi (${this.timeoutMs}ms). Vui lòng thử lại sau.`);
        err.code = 'QUEUE_TIMEOUT';
        reject(err);
      }, this.timeoutMs);

      const task = async () => {
        if (isTimedOut) return;
        clearTimeout(timer);
        
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      // Lưu trữ thêm hàm reject để hỗ trợ tìm kiếm khi timeout
      task.reject = reject;

      this.queue.push(task);
      this.next();
    });
  }

  next() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      this.running++;
      task().finally(() => {
        this.running--;
        this.next();
      });
    }
  }
}

module.exports = TaskQueue;
