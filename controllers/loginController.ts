import { LoginParam } from "../case/model/login/ILogin";
import { Controller, Post } from "../decorators/controller";
import LoginService from "../services/loginService";
import { BaseController } from "./baseController";

@Controller('auth')
export class LoginController extends BaseController {
    private loginService: LoginService;
    constructor() {
        super();
        this.loginService = new LoginService();
    }

    @Post('/login')
    async login(req: Request) {
        const body = req.body as any;
        const param: LoginParam = {
            username: body?.username || '',
            password: body?.password || ''
        };
        return this.loginService.createUser(param);
    }


}