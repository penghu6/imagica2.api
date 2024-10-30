const buildDao = require('../dao/buildDao');

class BuildService {
  /**
   * 创建新构建记录
   * @param {Object} buildData - 构建数据
   * @returns {Promise<Object>} 创建的构建记录
   */
  async createBuild(buildData) {
    return buildDao.createBuild(buildData);
  }

  /**
   * 获取项目的所有构建记录
   * @param {String} projectId - 项目ID
   * @returns {Promise<Array>} 构建记录列表
   */
  async getProjectBuilds(projectId) {
    return buildDao.findBuildsByProjectId(projectId);
  }

  /**
   * 更新构建记录
   * @param {String} buildId - 构建ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的构建记录对象
   */
  async updateBuild(buildId, updateData) {
    return buildDao.updateBuild(buildId, updateData);
  }

  /**
   * 删除构建记录
   * @param {String} buildId - 构建ID
   * @returns {Promise<Object>} 删除的构建记录对象
   */
  async deleteBuild(buildId) {
    return buildDao.deleteBuild(buildId);
  }
}

module.exports = new BuildService();
