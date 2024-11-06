const ChatHistoryModel = require('../models/chatHistoryModel');

class ChatHistoryDao {
  /**
   * 创建或更新聊天记录
   * @param {string} projectId - 项目ID
   * @param {Array} messages - 聊天消息数组
   */
  async saveMessages(projectId, messages) {
    return ChatHistoryModel.findOneAndUpdate(
      { project: projectId },
      { 
        project: projectId,
        messages: messages
      },
      { upsert: true, new: true }
    );
  }

  /**
   * 获取项目的聊天记录
   * @param {string} projectId - 项目ID
   */
  async getMessages(projectId) {
    const history = await ChatHistoryModel.findOne({ project: projectId });
    return history ? history.messages : [];
  }
}

module.exports = new ChatHistoryDao();
