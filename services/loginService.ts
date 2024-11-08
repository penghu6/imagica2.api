import { LoginParam, ILoginResult } from "../case/model/login/ILogin";
import UserDao from "../dao/userDao";


class LoginService {
    private userDao: UserDao;
  
    constructor() {
      this.userDao = new UserDao();
    }
  
    /**
     * 创建新用户
     * @param userData 用户数据
     * @returns 创建的用户对象
     */
    async createUser(param: LoginParam): Promise<ILoginResult> {
       let user = await this.userDao.findUserByCredentials(param.username, param.password);
       if (!user) {
        throw new Error('用户不存在');
       }
       return {
        token: 'token',
        isSuccess: true
       }
    }
}

export default LoginService;
