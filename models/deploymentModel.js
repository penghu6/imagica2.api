const mongoose = require('mongoose');

/**
 * 部署记录模型
 * @description 存储项目部署记录和状态
 */
const deploymentSchema = new mongoose.Schema({
  // 关联项目
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel',
    required: true
  },
  // 关联构建
  build: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BuildModel',
    required: true
  },
  // 部署状态
  status: {
    type: String,
    enum: {
      values: ['pending', 'deploying', 'success', 'failed', 'rolled-back'],
      message: '无效的部署状态'
    },
    default: 'pending'
  },
  // 部署环境
  environment: {
    type: String,
    enum: ['production', 'staging'],
    default: 'production'
  },
  // 部署配置
  config: {
    domain: String,
    containerName: String,
    imageTag: String,
    port: Number,
    env: Map
  },
  // 部署日志
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error']
    },
    message: String
  }],
  // 部署信息
  deployInfo: {
    startTime: Date,
    endTime: Date,
    duration: Number,
    ipAddress: String,
    url: String
  },
  // 错误信息
  error: {
    code: String,
    message: String,
    stack: String
  }
}, {
  timestamps: true
});

// 索引
deploymentSchema.index({ project: 1, createdAt: -1 });
deploymentSchema.index({ status: 1 });
deploymentSchema.index({ build: 1 });

mongoose.model("deploymentModel", deploymentSchema, "deployments");
// 将此模型进行导出
module.exports = mongoose.model("deploymentModel");

