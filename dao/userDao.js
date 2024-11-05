const UserModel = require('../models/userModel');

class UserDao {
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户
   */
  async createUser(userData) {
    const user = new UserModel(userData);
    return user.save();
  }

  /**
   * 根据ID查找用户
   * @param {String} userId - 用户ID
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findUserById(userId) {
    return UserModel.findById(userId).select('+password');
  }

  /**
   * 根据邮箱查找用户
   * @param {String} email - 用户邮箱
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findUserByEmail(email) {
    return UserModel.findOne({ email }).select('+password');
  }

  /**
   * 更新用户信息
   * @param {String} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的用户对象或null
   */
  async updateUser(userId, updateData) {
    return UserModel.findByIdAndUpdate(userId, updateData, { new: true });
  }

  /**
   * 删除用户
   * @param {String} userId - 用户ID
   * @returns {Promise<Object|null>} 删除的用户对象或null
   */
  async deleteUser(userId) {
    return UserModel.findByIdAndDelete(userId);
  }

  /**
   * 查询所有用户
   * @returns {Promise<Array>} 用户列表
   */
  async findAllUsers() {
    return UserModel.find();
  }
}

module.exports = new UserDao(); 