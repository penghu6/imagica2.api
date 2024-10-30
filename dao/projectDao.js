const ProjectModel = require('../models/projectModel');

class ProjectDao {
  /**
   * 创建新项目
   * @param {Object} projectData - 项目数据
   * @returns {Promise<Object>} 创建的项目
   */
  async createProject(projectData) {
    const project = new ProjectModel(projectData);
    return project.save();
  }

  /**
   * 根据ID查找项目
   * @param {String} projectId - 项目ID
   * @returns {Promise<Object|null>} 项目对象或null
   */
  async findProjectById(projectId) {
    return ProjectModel.findById(projectId).populate('owner collaborators.user');
  }

  /**
   * 查找用户的所有项目
   * @param {String} userId - 用户ID
   * @returns {Promise<Array>} 项目列表
   */
  async findProjectsByUserId(userId) {
    return ProjectModel.find({ owner: userId }).populate('owner collaborators.user');
  }

  /**
   * 更新项目信息
   * @param {String} projectId - 项目ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的项目对象或null
   */
  async updateProject(projectId, updateData) {
    return ProjectModel.findByIdAndUpdate(projectId, updateData, { new: true });
  }

  /**
   * 删除项目
   * @param {String} projectId - 项目ID
   * @returns {Promise<Object|null>} 删除的项目对象或null
   */
  async deleteProject(projectId) {
    return ProjectModel.findByIdAndDelete(projectId);
  }
}

module.exports = new ProjectDao();
