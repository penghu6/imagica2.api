const DeploymentModel = require('../models/deploymentModel');

class DeploymentDao {
  /**
   * 创建新部署记录
   * @param {Object} deploymentData - 部署数据
   * @returns {Promise<Object>} 创建的部署记录
   */
  async createDeployment(deploymentData) {
    const deployment = new DeploymentModel(deploymentData);
    return deployment.save();
  }

  /**
   * 根据ID查找部署记录
   * @param {String} deploymentId - 部署ID
   * @returns {Promise<Object|null>} 部署记录对象或null
   */
  async findDeploymentById(deploymentId) {
    return DeploymentModel.findById(deploymentId).populate('project build');
  }

  /**
   * 查找项目的所有部署记录
   * @param {String} projectId - 项目ID
   * @returns {Promise<Array>} 部署记录列表
   */
  async findDeploymentsByProjectId(projectId) {
    return DeploymentModel.find({ project: projectId }).sort({ createdAt: -1 });
  }

  /**
   * 更新部署记录
   * @param {String} deploymentId - 部署ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的部署记录对象或null
   */
  async updateDeployment(deploymentId, updateData) {
    return DeploymentModel.findByIdAndUpdate(deploymentId, updateData, { new: true });
  }

  /**
   * 删除部署记录
   * @param {String} deploymentId - 部署ID
   * @returns {Promise<Object|null>} 删除的部署记录对象或null
   */
  async deleteDeployment(deploymentId) {
    return DeploymentModel.findByIdAndDelete(deploymentId);
  }
}

module.exports = new DeploymentDao(); 