import { IUserParam, IUserResult } from '../case/model/user/IUser';
import UserModel from '../models/userModel';

class UserDao {
  /**
   * 创建新用户
   * @param param 用户创建参数，包含用户的基本信息
   * @returns 返回创建成功的用户信息
   */
  async createUser(param: IUserParam): Promise<IUserResult> {

    const userData = {
      ...param,
      avatar: param.avatar || '',
      email: param.email || '',
      createTime: new Date(),
      updateTime: new Date()
    };

    const result = await UserModel.create(userData);
    return {
        id: result._id.toString(), 
        username: result.username,
        email: result.email,
        avatar: result.avatar || ''
    };
  }

  /**
   * 根据用户ID查找用户
   * @param userId 用户ID
   * @returns 返回查找到的用户信息，如果未找到则返回 null
   */
  async findUserById(userId: string): Promise<IUserResult | null> {
    return UserModel.findById(userId);
  }

  /**
   * 删除指定用户
   * @param userId 要删除的用户ID
   * @returns 返回被删除的用户信息，如果未找到则返回 null
   */
  async deleteUser(userId: string): Promise<IUserResult | null> {
    return UserModel.findByIdAndDelete(userId);
  }

  /**
   * 获取所有用户列表
   * @returns 返回所有用户的数组
   */
  async findAllUsers(): Promise<IUserResult[]> {
    return UserModel.find();
  }

  /**
   * 通过ID更新用户信息
   * @param userId 用户ID
   * @param updateData 需要更新的用户数据，支持部分更新
   * @returns 返回更新后的用户信息，如果未找到则返回 null
   */
  async updateUserById(
    userId: string,
    updateData: Partial<IUserParam>
  ): Promise<IUserResult | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,        // 返回更新后的文档
        runValidators: true  // 运行验证器
      }
    );
  }

  /**
   * 根据用户名和密码查找用户
   * @param username 用户名
   * @param password 密码
   * @returns 返回查找到的用户信息，如果未找到则返回 null
   */
  async findUserByCredentials(username: string, password: string): Promise<IUserResult | null> {
    const result = await UserModel.findOne({ 
        username,
        password  // 注意：实际项目中应该使用加密后的密码比较
    });
    
    if (!result) {
        return null;
    }

    return {
        id: result._id.toString(),
        username: result.username,
        email: result.email,
        avatar: result.avatar || ''
    };
  }
}

export default UserDao;
