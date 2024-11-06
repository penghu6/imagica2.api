const chatHistoryDao = require('../dao/chatHistoryDao');

class ChatHistoryService {
  /**
   * 获取项目的聊天记录
   * @param {String} projectId - 项目ID
   * @returns {Promise<Array>} 聊天记录列表
   */
  async getMessages(projectId) {
    return chatHistoryDao.getMessages(projectId);
  }

  /**
   * 保存项目的聊天记录
   * @param {String} projectId - 项目ID
   * @param {Array} messages - 聊天消息数组
   * @returns {Promise<Object>} 保存的聊天记录
   */
  async saveMessages(projectId, messages) {
    return chatHistoryDao.saveMessages(projectId, messages);
  }

  /**
   * 删除项目的聊天记录
   * @param {String} projectId - 项目ID
   * @returns {Promise<Object>} 删除的聊天记录
   */
  async deleteMessages(projectId) {
    return chatHistoryDao.deleteMessages(projectId);
  }
}

module.exports = new ChatHistoryService(); 