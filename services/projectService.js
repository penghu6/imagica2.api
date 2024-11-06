const projectDao = require('../dao/projectDao');
const chatHistoryDao = require('../dao/chatHistoryDao');

class ProjectService {
  /**
   * 创建新项目
   * @param {Object} projectData - 项目数据
   * @param {Array} chatMessages - 聊天记录
   */
  async createProject(projectData, chatMessages = []) {
    try {
      // 1. 创建项目
      const project = await projectDao.createProject(projectData);

      // 2. 保存聊天记录
      if (chatMessages.length > 0) {
        await chatHistoryDao.saveMessages(project._id, chatMessages);
      }

      return project;
    } catch (error) {
      throw new Error(`创建项目失败: ${error.message}`);
    }
  }

  /**
   * 获取用户的所有项目
   * @param {String} userId - 用户ID
   * @returns {Promise<Array>} 项目列表
   */
  async getUserProjects(userId) {
    return projectDao.findProjectsByUserId(userId);
  }

  /**
   * 更新项目信息
   * @param {String} projectId - 项目ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的项目对象
   */
  async updateProject(projectId, updateData) {
    return projectDao.updateProject(projectId, updateData);
  }

  /**
   * 删除项目
   * @param {String} projectId - 项目ID
   * @returns {Promise<Object>} 删除的项目对象
   */
  async deleteProject(projectId) {
    return projectDao.deleteProject(projectId);
  }

  /**
   * 获取项目的聊天记录
   * @param {String} projectId - 项目ID
   */
  async getProjectChatHistory(projectId) {
    return chatHistoryDao.getMessages(projectId);
  }

  /**
   * 根据ID查找项目
   * @param {String} projectId - 项目ID
   * @returns {Promise<Object|null>} 项目对象或null
   */
  async findProjectById(projectId) {
    return projectDao.findProjectById(projectId);
  }
}

module.exports = new ProjectService();
