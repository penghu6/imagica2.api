const projectDao = require('../dao/projectDao');
const chatHistoryDao = require('../dao/chatHistoryDao');

class ProjectService {
  /**
   * 创建新项目
   * @param {Object} projectData - 项目数据
   */
  async createProject(projectData) {
    const { chatMessages, ...projectInfo } = projectData;

    // 1. 创建项目
    const project = await projectDao.createProject(projectInfo);

    // 2. 保存聊天记录
    if (chatMessages && chatMessages.length > 0) {
      await chatHistoryDao.saveMessages(project._id, chatMessages);
    }

    return project;
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
    const { chatMessages, ...projectInfo } = updateData;

    // 1. 更新项目信息
    const project = await projectDao.updateProject(projectId, projectInfo);

    // 2. 如果有聊天记录，更新聊天记录
    if (chatMessages && chatMessages.length > 0) {
      await chatHistoryDao.saveMessages(projectId, chatMessages);
    }

    return project;
  }

  /**
   * 删除项目
   * @param {String} projectId - 项目ID
   * @returns {Promise<Object>} 删除的项目对象
   */
  async deleteProject(projectId) {
    const project = await projectDao.deleteProject(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 删除关联的聊天记录
    await chatHistoryDao.deleteMessages(projectId);

    return project;
  }

  /**
   * 获取项目详情（包含聊天记录）
   * @param {String} projectId - 项目ID
   * @returns {Promise<Object>} 项目详情和聊天记录
   */
  async getProjectDetail(projectId) {
    const [project, chatMessages] = await Promise.all([
      projectDao.findProjectById(projectId),
      chatHistoryDao.getMessages(projectId)
    ]);

    if (!project) {
      throw new Error('项目不存在');
    }

    return {
      ...project.toObject(),
      chatMessages
    };
  }
}

module.exports = new ProjectService();
