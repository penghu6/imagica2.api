const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  // 关联的项目
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel',
    required: true
  },
  // 聊天记录
  messages: [{
    content: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['assistant', 'user'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// 创建索引
chatHistorySchema.index({ project: 1 });

module.exports = mongoose.model('ChatHistoryModel', chatHistorySchema, 'chatHistories');
