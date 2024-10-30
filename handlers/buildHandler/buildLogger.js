const fs = require('fs').promises;
const path = require('path');

class BuildLogger {
  constructor() {
    this.baseLogPath = path.join(process.env.STORAGE_PATH || 'storage', 'logs', 'builds');
  }

  /**
   * 记录构建日志
   * @param {string} buildId - 构建ID
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} [details] - 详细信息
   */
  async log(buildId, level, message, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    };

    await this.writeLog(buildId, logEntry);
  }

  /**
   * 写入日志文件
   * @param {string} buildId - 构建ID
   * @param {Object} logEntry - 日志条目
   */
  async writeLog(buildId, logEntry) {
    const logDir = path.join(this.baseLogPath, buildId);
    const logFile = path.join(logDir, 'build.log');

    try {
      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(
        logFile,
        JSON.stringify(logEntry) + '\n',
        'utf8'
      );
    } catch (error) {
      console.error('写入日志失败:', error);
    }
  }

  /**
   * 获取构建日志
   * @param {string} buildId - 构建ID
   * @returns {Promise<Array>} 日志条目数组
   */
  async getLogs(buildId) {
    const logFile = path.join(this.baseLogPath, buildId, 'build.log');
    try {
      const content = await fs.readFile(logFile, 'utf8');
      return content
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }
}

module.exports = new BuildLogger();
