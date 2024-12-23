import { Response } from "express";
import { FileStructure } from "../models/file";
import { IProject } from "../models/projectModel";
import ProjectService from "../services/projectService";
import { join, sep as pathSep } from "path";
import {
  ensureDir,
  copy,
  remove,
  ensureFile,
  writeFile,
  readdir,
  existsSync,
} from "fs-extra";
import { exec } from "child_process";
import { Readable } from "stream";
import { WebContainerFileSystem } from "./WebContainerFileSystem";
import { PublishResult } from "../services/projectPublishService";

export type ProjectStructureMap = {
  [key: string]: Pick<FileStructure, "name" | "path" | "content">;
};
export type ProjectStructureMapOptions = {
  withRoot?: boolean;
  rootPath?: string;
  sep?: string;
};
export class ProjectStructureMapUtil {
  static structureToMap(
    structure: FileStructure[],
    options?: ProjectStructureMapOptions
  ): ProjectStructureMap {
    const map: ProjectStructureMap = {};

    function traverse(node: FileStructure, parentPath: string) {
      const currentPath = join(parentPath, node.name);

      if (node.children) {
        for (const child of node.children) {
          traverse(child, currentPath);
        }
      } else {
        let key = options?.withRoot ? join(pathSep, currentPath) : currentPath;
        // repalce pathSep to sep
        if (options?.sep) {
          key = key.split(pathSep).join(options.sep);
        }

        map[key] = {
          name: node.name,
          path: currentPath,
          content: node.content || "",
        };
      }
    }

    for (const file of structure) {
      traverse(file, options?.rootPath || "");
    }

    return map;
  }
}

export class ProjectCompiler {
  private mode: 1 | 2 | 3 = 1;
  private root: string;
  private projectService: ProjectService;
  constructor({
    root,
    projectService,
  }: {
    root: string;
    projectService: ProjectService;
  }) {
    this.root = root;
    this.projectService = projectService;
  }

  async getCompilePathByProject(project: IProject, mode: number = this.mode) {
    // 1. 直接使用项目开发目录
    if (mode === 1) {
      return Promise.resolve(project.paths.development);
    }
    // 2. 复制项目开发目录到编译目录
    if (mode === 2) {
      return this.copyFileToCompile(project);
    }

    // 3. 将项目结构写入编译目录
    const projectId = project.id || "";
    const structure = await this.projectService.getProjectStructure(
      "",
      projectId
    );
    const smap = ProjectStructureMapUtil.structureToMap(structure);
    return this.writeToFileSystem(projectId, smap);
  }

  async copyFileToCompile(project: IProject) {
    const targetPath = this.getCompilePath(project.id || "");

    await ensureDir(targetPath);

    await copy(project.paths.development, targetPath, { overwrite: true });

    return targetPath;
  }

  private getCompilePath(projectId: string) {
    return join(this.root, projectId);
  }

  async writeToFileSystem(
    uuid: string,
    structureMap: ProjectStructureMap
  ): Promise<string> {
    const targetPath = this.getCompilePath(uuid);

    // 删除已有目录
    await remove(targetPath);

    for (const file of Object.values(structureMap)) {
      const filePath = join(targetPath, file.path);
      const fileContent = file.content || "";

      // 确保文件存在
      await ensureFile(filePath);

      // 写入文件
      await writeFile(filePath, fileContent, "utf-8");
    }

    return targetPath;
  }

  async execPromise(command: string, stream: Readable) {
    return new Promise((resolve, reject) => {
      const compileProcess = exec(command, { timeout: 60000 });

      compileProcess.stdout?.on("data", (data) => {
        stream.push("\n" + data.toString());
      });
      compileProcess.stderr?.on("data", (data) => {
        stream.push("\n" + data.toString());
      });

      compileProcess.on("error", (error) => {
        stream.push("\n命令执行错误：" + error.message);
        reject(error);
      });

      compileProcess.on("close", (code) => {
        if (code === 0) {
          resolve("命令执行完成");
        } else {
          reject("命令执行失败");
        }
      });
    });
  }

  async compile(targetPath: string, res: Response) {
    const stream = new Readable({
      read() {},
    });
    // 将可读流管道到响应
    stream.pipe(res);

    function over() {
      stream.push("\n编译结束");
      stream.push(null); // 结束流
      res.end(); // 结束响应
    }

    try {
      stream.push("\n检查node版本...");
      await this.execPromise(`cd ${targetPath} && node -v`, stream);

      stream.push("\n开始安装依赖...");
      await this.execPromise(`cd ${targetPath} && npm install`, stream);

      stream.push("\n开始构建...");
      await this.execPromise(`cd ${targetPath} && npm run build`, stream);
    } catch (error) {
      console.log("\n编译过程中发生错误：" + error);
      stream.push("\n编译过程中发生错误：" + error);
    } finally {
      over();
    }
  }

  async getCompileStructureMap(
    project: IProject,
    options?: ProjectStructureMapOptions
  ): Promise<ProjectStructureMap> {
    const targetPath = await this.getCompilePathByProject(project, 1);

    const distPath = join(targetPath, "dist");

    if (!existsSync(distPath)) {
      return {};
    }

    const files = await new WebContainerFileSystem().getDirectoryStructure(
      distPath
    );

    console.log("files", files);

    return ProjectStructureMapUtil.structureToMap(files, options);
  }

  async getPublishResult(project: IProject): Promise<PublishResult> {
    const structureMap = await this.getCompileStructureMap(project, {
      withRoot: true,
      sep: "/",
    });

    const publishResult: PublishResult = {
      files: structureMap,
      project: project,
    };

    return publishResult;
  }

  async clearCompileDist(project: IProject) {
    const targetPath = await this.getCompilePathByProject(project, 1);
    const distPath = join(targetPath, "dist");
    await remove(distPath);
  }
}
