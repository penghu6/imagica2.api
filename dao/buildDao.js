const BuildModel = require('../models/buildModel');

class BuildDao {
  /**
   * 创建新构建记录
   * @param {Object} buildData - 构建数据
   * @returns {Promise<Object>} 创建的构建记录
   */
  async createBuild(buildData) {
    const build = new BuildModel(buildData);
    return build.save();
  }

  /**
   * 根据ID查找构建记录
   * @param {String} buildId - 构建ID
   * @returns {Promise<Object|null>} 构建记录对象或null
   */
  async findBuildById(buildId) {
    return BuildModel.findById(buildId).populate('project');
  }

  /**
   * 查找项目的所有构建记录
   * @param {String} projectId - 项目ID
   * @returns {Promise<Array>} 构建记录列表
   */
  async findBuildsByProjectId(projectId) {
    return BuildModel.find({ project: projectId }).sort({ createdAt: -1 });
  }

  /**
   * 更新构建记录
   * @param {String} buildId - 构建ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的构建记录对象或null
   */
  async updateBuild(buildId, updateData) {
    return BuildModel.findByIdAndUpdate(buildId, updateData, { new: true });
  }

  /**
   * 删除构建记录
   * @param {String} buildId - 构建ID
   * @returns {Promise<Object|null>} 删除的构建记录对象或null
   */
  async deleteBuild(buildId) {
    return BuildModel.findByIdAndDelete(buildId);
  }
}

module.exports = new BuildDao(); 