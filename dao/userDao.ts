import { IUserParam, IUserResult } from '../case/model/user/IUser';
import UserModel from '../models/userModel';

class UserDao {
  /**
   * 创建新用户
   * @param param 用户创建参数，包含用户的基本信息
   * @returns 返回创建成功的用户信息
   */
  async createUser(param: IUserParam): Promise<IUserResult> {
    param.avatar = param.avatar || '';
    param.name = param.name || '';
    const user = new UserModel(param);
    return user.save();
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
}

export default UserDao;
