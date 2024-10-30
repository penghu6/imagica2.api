const path = require('path');
const fs = require('fs').promises;
const buildQueue = require('./buildQueue');
const buildExecutor = require('./buildExecutor');
const buildLogger = require('./buildLogger');
const { ValidationError } = require('../../utils/errors');

class BuildHandler {
  constructor() {
    this.baseStoragePath = path.join(process.env.STORAGE_PATH || 'storage');
  }

  /**
   * 创建构建任务
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID
   * @param {string} version - 源代码版本
   * @returns {Promise<Object>} 构建信息
   */
  async createBuild(userId, projectId, version) {
    try {
      const buildInfo = {
        id: `build-${Date.now()}`,
        userId,
        projectId,
        version,
        status: 'pending',
        startTime: new Date(),
        logs: []
      };

      // 创建构建目录
      const buildDir = this.getBuildPath(userId, projectId, buildInfo.id);
      await fs.mkdir(buildDir, { recursive: true });

      // 保存构建信息
      await this.saveBuildInfo(userId, projectId, buildInfo);

      // 添加到构建队列
      await buildQueue.addTask({
        execute: async () => {
          await this.executeBuild(userId, projectId, buildInfo.id);
        }
      });

      return buildInfo;
    } catch (error) {
      throw new ValidationError('创建构建任务失败：' + error.message);
    }
  }

  /**
   * 处理构建请求
   * @param {Object} buildConfig - 构建配置
   * @returns {Promise<Object>} 构建结果
   */
  async handleBuild(buildConfig) {
    switch (buildConfig.type) {
      case 'client':
        return this.handleClientBuild(buildConfig);
      case 'server':
        return this.handleServerBuild(buildConfig);
      case 'cloud':
        return this.handleCloudBuild(buildConfig);
      default:
        throw new Error('不支持的构建类型');
    }
  }

  /**
   * 处理前端构建
   * @param {Object} buildConfig - 构建配置
   */
  async handleClientBuild(buildConfig) {
    // 验证并接收构建产物
    return this.processArtifacts(buildConfig);
  }

  /**
   * 处理后台构建
   * @param {Object} buildConfig - 构建配置
   */
  async handleServerBuild(buildConfig) {
    // 使用构建队列和执行器
    return this.executeServerBuild(buildConfig);
  }

  /**
   * 处理云构建
   * @param {Object} buildConfig - 构建配置
   */
  async handleCloudBuild(buildConfig) {
    // 触发云构建并等待回调
    return this.triggerCloudBuild(buildConfig);
  }

  // ... 其他方法保持不变 ...
}

module.exports = new BuildHandler();
