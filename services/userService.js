const userDao = require('../dao/userDao');

class UserService {
  /**
   * 注册新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户
   */
  async registerUser(userData) {
    // 检查邮箱是否已被注册
    const existingUser = await userDao.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }
    return userDao.createUser(userData);
  }

  /**
   * 用户登录
   * @param {String} email - 用户邮箱
   * @param {String} password - 用户密码
   * @returns {Promise<Object>} 用户对象
   */
  async loginUser(email, password) {
    const user = await userDao.findUserByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('邮箱或密码错误');
    }
    return user;
  }
  

  /**
   * 更新用户信息
   * @param {String} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的用户对象
   */
  async updateUser(userId, updateData) {
    return userDao.updateUser(userId, updateData);
  }

  /**
   * 删除用户
   * @param {String} userId - 用户ID
   * @returns {Promise<Object>} 删除的用户对象
   */
  async deleteUser(userId) {
    return userDao.deleteUser(userId);
  }

  /**
   * 获取所有用户
   * @returns {Promise<Array>} 用户列表
   */
  async findAllUsersService() {
    return await userDao.findAllUsers();
  }
}

module.exports = new UserService();
