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
import { OUTPUT_DIRS } from "./consts";
import { v4 as uuidv4 } from 'uuid';
import { IMessageResult, MessageRole, MessageType } from "../case/model/message/IMessage";
import ProjectDao from "../dao/projectDao";

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
  private projectDao: ProjectDao
  constructor({
    root,
    projectService,
  }: {
    root: string;
    projectService: ProjectService;
  }) {
    this.root = root;
    this.projectService = projectService;
    this.projectDao = new ProjectDao()
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

  async execPromise(command: string, stream: Readable, needStdout: boolean = false) {
    return new Promise((resolve, reject) => {
      const compileProcess = exec(command, { timeout: 60000 });

      if(needStdout) {
        compileProcess.stdout?.on("data", (data) => {
          const lines = data.toString().split('\n'); // 根据换行符拆分数据
          for (const line of lines) {
            if (line.trim()) { // 确保不发送空行
              stream.push(`data: ${line.trim()}\n\n`); // 逐行发送
            }
          }
        });
      }
      compileProcess.stderr?.on("data", (data) => {
        const lines = data.toString().split('\n'); // 根据换行符拆分数据
        for (const line of lines) {
          if (line.trim()) { // 确保不发送空行
            stream.push(`data: ${line.trim()}\n\n`); // 逐行发送
          }
        }
      });

      compileProcess.on("error", (error) => {
        const lines = error.message.toString().split('\n'); // 根据换行符拆分数据
        for (const line of lines) {
          if (line.trim()) { // 确保不发送空行
            stream.push(`data: run command error: ${line.trim()}\n\n`); // 逐行发送
          }
        }
        reject(error);
      });

      compileProcess.on("close", (code) => {
        if (code === 0) {
          resolve("命令执行完成");
        } else {
          let cmd = command
          if (command.includes('&&')) {
            cmd = command.split('&&').pop()?.trim() || '';
          }
          stream.push(`data: <COMMAND-FAILED>${cmd}<COMMAND-FAILED>\n\n`);
          reject(`${cmd} failed`);
        }
      });
    });
  }

  private getProjectIdFromPath(targetPath: string): string {
    const match = targetPath.match(/projects\\([^\\]+)\\development/);
    if (!match) {
        throw new Error('无法从路径中提取projectId');
    }
    return match[1];
}

async addPublishMsgToChat(targetPath: string, message: string) {
    try {
      const projectId = this.getProjectIdFromPath(targetPath);
      const messageId = uuidv4();
      const newMessage: IMessageResult = {
          messageId,
          projectId,
          role: MessageRole['assistant'],
          content: message,
          type: MessageType['text'],
          createdAt: Number(new Date())
      };
      
      await this.projectDao.addProjectMessage(projectId, [newMessage]);
    } catch (error: any) {
      console.error('添加发布消息失败:', error);
    }
  } 
  
  async pushCommand(stream: Readable, command: string, targetPath: string) {
    stream.push(`data: <COMMAND-START>${command}<COMMAND-START>\n\n`);
    await this.execPromise(`cd ${targetPath} && ${command}`, stream);
    stream.push(`data: <COMMAND-END>${command}<COMMAND-END>\n\n`);
  }

  async compile(targetPath: string, res: Response) {
    const stream = new Readable({
      read() {},
    });
    // 将可读流管道到响应
    stream.pipe(res);

    function over() {
      stream.push("data: [DONE]\n\n");
      stream.push(null); // 结束流
      res.end(); // 结束响应
    }
    const messageArr: string[] = [];
    stream.on('data', (chunk: Buffer) => {
      messageArr.push(chunk.toString().replace(/^data:/, '').trim());
    });
    try {
      // stream.push("data: node version:\n\n");
      // await this.execPromise(`cd ${targetPath} && node -v`, stream, true);
      console.log(new Date().toLocaleString(), "pull dependenices...");
      await this.pushCommand(stream, "pnpm install", targetPath);

      console.log(new Date().toLocaleString(), "build ...");
      await this.pushCommand(stream, "pnpm run build", targetPath);

      stream.push("data: Build Successful\n\n");
      console.log(new Date().toLocaleString(), "Build Successful");
    } catch (error) {
      console.log("\n编译过程中发生错误：", error);
      stream.push(`data: Build Failed: ${error}\n\n`);
    } finally {
      over();
      this.addPublishMsgToChat(targetPath, messageArr.join("\n"));
    }
  }

  async getCompileStructureMap(
    project: IProject,
    options?: ProjectStructureMapOptions
  ): Promise<ProjectStructureMap> {
    const targetPath = await this.getCompilePathByProject(project, 1);

    // 检查是否存在 dist 或 build 目录
    const existingDir = OUTPUT_DIRS.find(dir => existsSync(join(targetPath, dir)));

    if (!existingDir) {
      return {};
    }

    const dirPath = join(targetPath, existingDir);
    const files = await new WebContainerFileSystem().getDirectoryStructure(dirPath);

    // console.log("files", files);

    return ProjectStructureMapUtil.structureToMap(files, options);
  }

  async getPublishResult(project: IProject): Promise<PublishResult> {
    // sandpack 预览结构，需要使用 / 作为分隔符
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
    
    // 检查并删除 dist 或 build 目录
    for (const dir of OUTPUT_DIRS) {
      const dirPath = join(targetPath, dir);
      if (existsSync(dirPath)) {
        await remove(dirPath);
        break; // 找到并删除一个后退出循环
      }
    }
  }
}
