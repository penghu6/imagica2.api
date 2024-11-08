import { List } from 'lodash';
import { IUserParam, IUserResult, UserParam } from '../case/model/user/IUser';
import  UserDao  from '../dao/userDao';

class UserService {
  private userDao: UserDao;

  constructor() {
    this.userDao = new UserDao();
  }

  /**
   * 创建新用户
   * @param userData 用户数据
   * @returns 创建的用户对象
   */
  async createUser(param: UserParam): Promise<IUserResult> {
    return this.userDao.createUser(param);
  }

  /**
   * 根据用户ID获取用户
   * @param userId 用户ID
   * @returns 用户对象或null
   */
  async getUserById(userId: string): Promise<IUserResult | null> {
    return this.userDao.findUserById(userId);
  }

  /**
   * 更新用户信息
   * @param userId 用户ID
   * @param param 更新的用户数据
   * @returns 更新后的用户对象
   */
  async updateUserById(userId: string, param: Partial<IUserParam>): Promise<IUserResult | null> {
    return this.userDao.updateUserById(userId, param);
  }

  /**
   * 删除用户
   * @param userId 用户ID
   * @returns 被删除的用户对象或null
   */
  async deleteUser(userId: string): Promise<IUserResult | null> {
    return this.userDao.deleteUser(userId);
  }

  /**
   * 获取所有用户
   * @returns 用户列表
   */
  async getAllUsers(): Promise<List<IUserResult>> {
    return this.userDao.findAllUsers();
  }
}

export default UserService; 