import { Request, Response } from "express";
import { Controller, Post, Get } from "../decorators/controller";
import ProjectService from "../services/projectService";
import { formatResponse } from "../utils/tools";
import { BaseController } from "./baseController";
import { bucket } from "../config/storage";
import path from "path";
import { existsSync } from "fs-extra";
import {
  ProjectCompiler,
  ProjectStructureMapUtil,
} from "../utils/ProjectCompiler";
import ProjectPublishService from "../services/projectPublishService";
import { Mutex } from "async-mutex";
import { FileStructure } from "../models/file";

@Controller("build")
export class BuildController extends BaseController {
  private projectService: ProjectService;
  private projectPublishService: ProjectPublishService;
  private compiler: ProjectCompiler;
  private compileLocks: Map<string, Mutex>;

  constructor() {
    super();
    this.projectService = new ProjectService();
    this.projectPublishService = new ProjectPublishService();
    this.compiler = new ProjectCompiler({
      root: bucket.compile,
      projectService: this.projectService,
    });
    this.compileLocks = new Map();
  }

  @Post("/compile")
  async compile(req: Request, res: Response) {
    const projectId = req.body.projectId;
    if (
      !projectId ||
      typeof projectId !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(projectId)
    ) {
      res.write(JSON.stringify(formatResponse(1, "项目ID格式不正确")));
      return res.end();
    }

    let projectLock = this.compileLocks.get(projectId);
    if (!projectLock) {
      projectLock = new Mutex();
      this.compileLocks.set(projectId, projectLock);
    }

    await projectLock.runExclusive(async () => {
      try {
        const project =
          await this.projectService.projectDao.findProjectByIdNoReturn(
            projectId
          );
        if (!project) {
          res.write(JSON.stringify(formatResponse(1, "项目不存在")));
          return res.end();
        }

        const targetPath = path.resolve(
          await this.compiler.getCompilePathByProject(project)
        );

        const packageJsonPath = path.join(targetPath, "package.json");
        if (!existsSync(packageJsonPath)) {
          res.write(JSON.stringify(formatResponse(1, "package.json 不存在")));
          return res.end();
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        try {
          await this.compiler.compile(targetPath, res);
        } catch (compileError) {
          res.write(
            JSON.stringify(
              formatResponse(1, "编译失败", (compileError as Error).message)
            )
          );
          return res.end();
        }

        try {
          const publishResult = await this.compiler.getPublishResult(project);
          await this.projectPublishService.savePublishResult(publishResult);
          await this.projectService.updatePublishSettings(projectId, {
            customDomain: "",
            published: true,
            publishTime: Date.now(),
          });
        } catch (publishError) {
          res.write(
            JSON.stringify(
              formatResponse(
                1,
                "保存发布结果失败",
                (publishError as Error).message
              )
            )
          );
          return res.end();
        }

        try {
          await this.compiler.clearCompileDist(project);
          res.write(JSON.stringify(formatResponse(0, "编译和清理成功")));
        } catch (clearError) {
          res.write(
            JSON.stringify(
              formatResponse(
                1,
                "清理编译结果失败",
                (clearError as Error).message
              )
            )
          );
        }
      } catch (e) {
        res.write(
          JSON.stringify(
            formatResponse(1, "获取项目结构失败", (e as Error).message)
          )
        );
      } finally {
        res.end();
      }
    });
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

  @Post("/unpublish/:projectId")
  async unpublish(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    if (!projectId) {
      return formatResponse(1, "项目ID不能为空");
    }

    try {
      await this.projectService.updatePublishSettings(projectId, {
        published: false,
        publishTime: undefined,
      });

      await this.projectPublishService.removePublishResult(projectId);
      return formatResponse(0, "取消发布成功");
    } catch (e) {
      return formatResponse(1, "取消发布成功", (e as Error).message);
    }
  }

  @Post("/publish-files/:projectId")
  async publishFiles(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    if (!projectId) {
      return formatResponse(1, "项目ID不能为空");
    }

    const files = req.body.files as FileStructure[];
    if (!files || !Array.isArray(files)) {
      return formatResponse(1, "文件不能为空");
    }

    const project =
      await this.projectService.projectDao.findProjectByIdNoReturn(projectId);
    if (!project) {
      return formatResponse(1, "项目不存在");
    }

    // 将文件结构转换为结构映射， sandpack 预览结构需要使用 / 作为分隔符
    const structureMap = ProjectStructureMapUtil.structureToMap(files, {
      withRoot: true,
      sep: "/",
    });

    try {
      await this.projectPublishService.savePublishResult({
        project,
        files: structureMap,
      });

      const result = await this.projectService.updatePublishSettings(projectId, {
        customDomain: "",
        published: true,
        publishTime: Date.now(),
      });

      return formatResponse(0, "发布文件成功", result);
    } catch (e) {
      return formatResponse(1, "发布文件失败", (e as Error).message);
    }
  }
}
