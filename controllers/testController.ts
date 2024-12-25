import { exec } from "child_process";
import { UserParam } from "../case/model/user/IUser";
import { Controller, Get, Post } from "../decorators/controller";
import { ModelBinder } from "../decorators/modelBinder";
import UserService from "../services/userService";
import { formatResponse } from "../utils/tools";
import { BaseController } from "./baseController";

@Controller("test")
export class TestController extends BaseController {
  private userService: UserService;
  constructor() {
    super();
    this.userService = new UserService();
  }

  execPromise(command: string) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  @Get("/getEnv")
  async getEnv(req: Request, res: Response) {

    const nodeVersion = await this.execPromise("node -v").catch((error) => {
      return "node -v 获取失败";
    });
    const npmVersion = await this.execPromise("npm -v").catch((error) => {
      return "npm -v 获取失败";
    });
    const pnpmVersion = await this.execPromise("pnpm -v").catch((error) => {
      return "pnpm -v 获取失败";
    });
    const dockerVersion = await this.execPromise("docker -v").catch((error) => {
      return "docker -v 获取失败";
    });
    const dockerComposeVersion = await this.execPromise("docker-compose -v").catch((error) => {
      return "docker-compose -v 获取失败";
    });

    return formatResponse(0, "测试成功", {
      nodeVersion,
      npmVersion,
      pnpmVersion,
      dockerVersion,
      dockerComposeVersion,
    });
  }
}
