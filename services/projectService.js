const projectDao = require('../dao/projectDao');

class ProjectService {
  /**
   * 创建新项目
   * @param {Object} projectData - 项目数据
   * @returns {Promise<Object>} 创建的项目
   */
  async createProject(projectData) {
    return projectDao.createProject(projectData);
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
}

module.exports = new ProjectService();
