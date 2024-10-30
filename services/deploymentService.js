const deploymentDao = require('../dao/deploymentDao');

class DeploymentService {
  /**
   * 创建新部署记录
   * @param {Object} deploymentData - 部署数据
   * @returns {Promise<Object>} 创建的部署记录
   */
  async createDeployment(deploymentData) {
    return deploymentDao.createDeployment(deploymentData);
  }

  /**
   * 获取项目的所有部署记录
   * @param {String} projectId - 项目ID
   * @returns {Promise<Array>} 部署记录列表
   */
  async getProjectDeployments(projectId) {
    return deploymentDao.findDeploymentsByProjectId(projectId);
  }

  /**
   * 更新部署记录
   * @param {String} deploymentId - 部署ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的部署记录对象
   */
  async updateDeployment(deploymentId, updateData) {
    return deploymentDao.updateDeployment(deploymentId, updateData);
  }

  /**
   * 删除部署记录
   * @param {String} deploymentId - 部署ID
   * @returns {Promise<Object>} 删除的部署记录对象
   */
  async deleteDeployment(deploymentId) {
    return deploymentDao.deleteDeployment(deploymentId);
  }
}

module.exports = new DeploymentService();
