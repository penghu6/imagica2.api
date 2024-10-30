const mongoose = require('mongoose');

/**
 * 构建记录模型
 * @description 存储项目构建记录和日志
 */
const buildSchema = new mongoose.Schema({
  // 关联项目
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel',
    required: true
  },
  // 构建版本
  version: {
    type: String,
    required: true
  },
  // 构建状态
  status: {
    type: String,
    enum: {
      values: ['pending', 'building', 'success', 'failed', 'canceled'],
      message: '无效的构建状态'
    },
    default: 'pending'
  },
  // 构建日志
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
  // 构建信息
  buildInfo: {
    startTime: Date,
    endTime: Date,
    duration: Number,  // 构建持续时间(秒)
    nodeVersion: String,
    buildCommand: String
  },
  // 构建结果
  output: {
    size: Number,      // 构建产物大小
    files: [String],   // 构建产物文件列表
    checksum: String   // 构建产物校验和
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
buildSchema.index({ project: 1, createdAt: -1 });
buildSchema.index({ status: 1 });

module.exports = mongoose.model('BuildModel', buildSchema, 'builds');
