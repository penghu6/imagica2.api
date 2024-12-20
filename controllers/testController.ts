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

    const nodeVersion = await this.execPromise("node -v");
    const npmVersion = await this.execPromise("npm -v");
    const dockerVersion = await this.execPromise("docker -v");
    const dockerComposeVersion = await this.execPromise("docker-compose -v");

    return formatResponse(0, "测试成功", {
      nodeVersion,
      npmVersion,
      dockerVersion,
      dockerComposeVersion,
    });
  }
}
