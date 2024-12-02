import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import glob from 'glob-promise';
import mongoose from 'mongoose';
import { IMessageResult } from '../case/model/message/IMessage';
import { getRealPath } from './fileHelper';

type ProjectType = 'react' | 'vue' | 'html' | 'nextjs';

export interface FileInfo {
  relativePath: string;
  hash: string;
}

export interface FileMapping {
  id: mongoose.Types.ObjectId;
  relativePath: string;
  hash: string;
  lastModified: Date;
  lastSyncTime: Date;
  status: 'synced' | 'modified' | 'conflict';
}

export class FileManager {
  private static readonly TEMPLATE_MAP: Record<ProjectType, string> = {
    react: 'react-template',
    vue: 'vue-template',
    html: 'html-template',
    nextjs: 'nextjs-template'
  };

  /**
   * 初始化项目结构
   */
  static async initializeProject(type: ProjectType, developmentPath: string): Promise<void> {
    const templateName = this.TEMPLATE_MAP[type];
    const templatePath = this.getTemplatePath(templateName);
    console.log("templatePath", templatePath);
    
    // 检查模板是否存在
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found for project type: ${type}`);
    }

    // 复制模板到项目目录
    await fs.copy(templatePath, developmentPath);

    // 根据项目类型进行特殊处理
    switch (type) {
      case 'react':
        await this.initReactProject(developmentPath);
        break;
      case 'vue':
        await this.initVueProject(developmentPath);
        break;
      case 'nextjs':
        await this.initNextjsProject(developmentPath);
        break;
      case 'html':
        await this.initHtmlProject(developmentPath);
        break;
    }
  }

  private static async initReactProject(path: string): Promise<void> {
    // 初始化 React 项目特定配置
    const packageJson = await fs.readJson(`${path}/package.json`);
    packageJson.name = 'react-project';
    await fs.writeJson(`${path}/package.json`, packageJson, { spaces: 2 });
  }

  private static async initVueProject(path: string): Promise<void> {
    // 初始化 Vue 项目特定配置
    const packageJson = await fs.readJson(`${path}/package.json`);
    packageJson.name = 'vue-project';
    await fs.writeJson(`${path}/package.json`, packageJson, { spaces: 2 });
  }

  private static async initNextjsProject(path: string): Promise<void> {
    // 初始化 Next.js 项目特定配置
    const packageJson = await fs.readJson(`${path}/package.json`);
    packageJson.name = 'nextjs-project';
    await fs.writeJson(`${path}/package.json`, packageJson, { spaces: 2 });
  }

  private static async initHtmlProject(path: string): Promise<void> {
    // 初始化 HTML 项目特定配置
    await fs.ensureFile(`${path}/index.html`);
  }

  static async cpProjectCode(uploadPath: string | undefined, developmentPath: string): Promise<void> {
    if (!uploadPath) {
      throw new Error("创建项目失败，没有文件路径");
    }
    const basePath = process.env.FILE_PATH || './public';
    const realPath = getRealPath(uploadPath, basePath)
    // 检查 uploadPath 是否存在
    const uploadPathExists = await fs.pathExists(realPath);
    if (!uploadPathExists) {
        throw new Error(`上传路径不存在: ${uploadPath}`);
    }

    try {
      // 使用 fs-extra 的 copy 方法直接复制整个目录
      await fs.move(realPath, developmentPath, { overwrite: true });
    } catch (error: any) {
      throw new Error(`复制项目代码失败: ${error.message}`);
    }
  }

  /**
   * 生成初始文件映射
   */
  static async generateFileMapping(developmentPath: string): Promise<FileMapping[]> {
    const files = await this.scanDirectory(developmentPath);
    return files.map(file => ({
      id: new mongoose.Types.ObjectId(),
      relativePath: file.relativePath,
      hash: file.hash,
      lastModified: new Date(),
      lastSyncTime: new Date(),
      status: 'synced' as const
    }));
  }

  /**
   * 扫描目录
   */
  private static async scanDirectory(directoryPath: string): Promise<FileInfo[]> {
    const files: string[] = await glob('**/*', {
      cwd: directoryPath,
      dot: true,
      nodir: true
    });

    return Promise.all(files.map(async (file: string) => {
      const absolutePath = path.join(directoryPath, file);
      const content = await fs.readFile(absolutePath);
      const hash = crypto
        .createHash('md5')
        .update(content)
        .digest('hex');

      return {
        relativePath: file,
        hash
      };
    }));
  }

  static getTemplatePath(templateName: string): string {
    // 从环境变量中获取基础路径
    const basePath = process.env.FILE_PATH || '默认路径'; // 如果环境变量未设置，可以提供一个默认路径

    // 构建完整的模板路径
    const templatePath = path.join(basePath, 'templates', templateName);

    return templatePath;
  }

  static stringifyMessage(messages: IMessageResult[]): IMessageResult[] {
   const encodeMsg = messages.map(x => {
      const content = typeof x.content === "object" ? JSON.stringify(x.content) : x.content
      return Object.assign(x, {content})
    })
    return encodeMsg
  }

  static parseMessage(messages: IMessageResult[]): IMessageResult[] {
    const decodeMsg = messages.map(x => {
      let content = x.content
      try {
        content = typeof x.content === "string" ? JSON.parse(x.content) : x.content
      } catch{
        //什么也不用做
      }
      return Object.assign(x, {content})
    });
    return decodeMsg
  }
}
