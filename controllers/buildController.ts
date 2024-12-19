import { Request, Response } from "express";
import { Controller, Post, Get } from "../decorators/controller";
import ProjectService from "../services/projectService";
import { formatResponse } from "../utils/tools";
import { BaseController } from "./baseController";
import { bucket } from "../config/storage";
import path from "path";
import { existsSync } from "fs-extra";
import { ProjectCompiler } from "../utils/ProjectCompiler";
import ProjectPublishService from "../services/projectPublishService";

@Controller("build")
export class BuildController extends BaseController {
  private projectService: ProjectService;
  private projectPublishService: ProjectPublishService;
  private compiler: ProjectCompiler;

  constructor() {
    super();
    this.projectService = new ProjectService();
    this.projectPublishService = new ProjectPublishService();
    this.compiler = new ProjectCompiler({
      root: bucket.compile,
      projectService: this.projectService,
    });
  }

  @Post("/compile")
  async compile(req: Request, res: Response) {
    const projectId = req.body.projectId;
    if (!projectId) {
      res.write(JSON.stringify(formatResponse(1, "项目ID不能为空")));
      return res.end();
    }

    const project =
      await this.projectService.projectDao.findProjectByIdNoReturn(projectId);
    if (!project) {
      res.write(JSON.stringify(formatResponse(1, "项目不存在")));
      return res.end();
    }

    try {
      const targetPath = await this.compiler.getCompilePathByProject(project);

      // 检查是否存在 package.json
      const packageJsonPath = path.join(targetPath, "package.json");
      if (!existsSync(packageJsonPath)) {
        res.write(JSON.stringify(formatResponse(1, "package.json 不存在")));
        return res.end();
      }

      // 设置响应头，指示这是一个流式响应
      res.setHeader("Content-Type", "text/event-stream");

      // 开始编译并流式返回数据
      await this.compiler.compile(targetPath, res);

      // dist 数据保存
      const publishResult = await this.compiler.getPublishResult(project);
      await this.projectPublishService.savePublishResult(publishResult);

      // 清除编译结果
      await this.compiler.clearCompileDist(project);
    } catch (e) {
      res.write(
        JSON.stringify(
          formatResponse(1, "获取项目结构失败", (e as Error).message)
        )
      );
      res.end();
    }
  }

  @Get("/dist/:projectId")
  async getDist(req: Request) {
    const projectId = req.params.projectId as string;
    if (!projectId) {
      return formatResponse(1, "项目ID不能为空");
    }

    try {
      const project =
        await this.projectService.projectDao.findProjectByIdNoReturn(projectId);
      if (!project) {
        return formatResponse(1, "项目不存在");
      }

      const publishResult = await this.projectPublishService.getPublishResult(
        project
      );

      await this.projectPublishService.savePublishResult(publishResult);
      return formatResponse(0, "获取项目结构成功", publishResult);
    } catch (e) {
      return formatResponse(1, "获取项目结构失败", (e as Error).message);
    }
  }
}
