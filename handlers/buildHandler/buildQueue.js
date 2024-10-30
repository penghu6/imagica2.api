class BuildQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * 添加构建任务到队列
   * @param {Object} buildTask - 构建任务信息
   */
  async addTask(buildTask) {
    this.queue.push(buildTask);
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * 处理构建队列
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const task = this.queue.shift();

    try {
      await task.execute();
    } catch (error) {
      console.error('构建任务执行失败:', error);
    }

    this.processQueue();
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态信息
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.processing
    };
  }
}

module.exports = new BuildQueue();
