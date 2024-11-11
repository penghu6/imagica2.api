import path from 'path';
import fs from 'fs-extra';
import { FileStructure } from '../models/file';

export class WebContainerFileSystem {
  private readonly basePath: string;

  constructor() {
    this.basePath = process.env.FILE_PATH || 'bucket';
  }


  async getProjectDevelopmentFiles(developmentPath: string): Promise<FileStructure[]> {
    try {
      
      if (!await fs.pathExists(developmentPath)) {
        throw new Error('项目目录不存在');
      }
      console.log("developmentPath", developmentPath);
      return await this.getDirectoryStructure(developmentPath);
    } catch (error: any) {
      throw new Error(`获取项目文件失败: ${error.message}`);
    }
  }


  /**
   * 获取文件内容
   */
  async getFileContent(developmentPath: string, filePath: string): Promise<string> {
    try {
      this.validatePath(filePath);
      const fullPath = path.join(developmentPath, filePath);
      await this.validateFileAccess(fullPath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error: any) {
      throw new Error(`获取文件内容失败: ${error.message}`);
    }
  }

  /**
   * 获取目录结构
   */
  private async getDirectoryStructure(
    dirPath: string,
    basePath: string = ''
  ): Promise<FileStructure[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const structure: FileStructure[] = [];

    for (const entry of entries) {
      if (this.shouldSkipFile(entry.name)) {
        continue;
      }

      const relativePath = path.join(basePath, entry.name);
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const children = await this.getDirectoryStructure(fullPath, relativePath);
        structure.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children
        });
      } else {
        structure.push({
          name: entry.name,
          type: 'file',
          path: relativePath
        });
      }
    }

    return structure;
  }

  /**
   * 判断是否应该跳过该文件
   */
  private shouldSkipFile(filename: string): boolean {
    const skipPatterns = [
      /^\./, // 隐藏文件
      /^node_modules$/,
      /^dist$/,
      /^build$/,
      /^\.git$/
    ];

    return skipPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * 验证路径安全性
   */
  private validatePath(filePath: string): void {
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
      throw new Error('非法的文件路径');
    }
  }

  /**
   * 验证文件访问
   */
  private async validateFileAccess(filePath: string): Promise<void> {
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new Error('不是有效的文件');
      }
    } catch (error) {
      throw new Error('文件不存在或无法访问');
    }
  }
} 