import { UserParam } from "../case/model/user/IUser";
import { Controller, Post } from "../decorators/controller";
import { ModelBinder } from "../decorators/modelBinder";
import UserService from "../services/userService";
import { formatResponse } from "../utils/tools";
import { BaseController } from "./baseController";

@Controller('user')
export class UserController extends BaseController {
    private userService: UserService;
    constructor() {
        super();
        this.userService = new UserService();
    }

    /**
     * 创建新用户
     * @description 创建一个新的用户账户，包含用户名、密码等基本信息
     * 
     * @param {UserParam} param - 用户创建参数
     * @param {string} param.username - 用户名（必填）
     * @param {string} param.password - 密码（必填）
     * @param {string} [param.email] - 邮箱（可选）
     * @param {string} [param.avatar] - 头像URL（可选）
     * 
     * @returns {Promise<{
     *   code: number,
     *   message: string,
     *   data?: {
     *     id: string,
     *     username: string,
     *     email: string,
     *     avatar: string,
     *     createTime: Date,
     *     updateTime: Date
     *   }
     * }>} 返回创建结果
     * 
     * @throws {ValidationError} 当参数验证失败时抛出
     * @example
     * POST /api/user/create
     * {
     *   "username": "test",
     *   "password": "123456",
     *   "email": "test@example.com"
     * }
     */
    @Post('/create')
    @ModelBinder(UserParam)
    async createUser(param: UserParam) {
        console.log("param", param);
        try {
            const result = await this.userService.createUser(param);
            return formatResponse(0, '创建用户成功', result);
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }
    

}