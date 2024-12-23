import path from 'path';
import fs from 'fs-extra';
import { FileStructure } from '../models/file';
import { IProject } from '../models/projectModel';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';

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

      // 获取文件扩展名
      const extname = path.extname(fullPath).toLowerCase();
      let mimeType = 'application/octet-stream'; // 默认类型

      // 判断文件类型
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.ico'].includes(extname);

      if (isImage) {
        // 读取文件内容为二进制
        const fileBuffer = await fs.readFile(fullPath);
        // 将二进制数据转换为 Base64
        const base64Data = fileBuffer.toString('base64');
        // 根据文件类型设置 MIME 类型
        if (extname === '.jpg' || extname === '.jpeg') {
          mimeType = 'image/jpeg';
        } else if (extname === '.png') {
          mimeType = 'image/png';
        } else if (extname === '.gif') {
          mimeType = 'image/gif';
        } else if (extname === '.ico') {
          mimeType = 'image/x-icon';
        }
        // 返回 Base64 字符串，格式为 data URI
        return `data:${mimeType};base64,${base64Data}`;
      } else {
        // 读取文件为 Buffer
        const fileBuffer = await fs.readFile(fullPath);

        // 检测文件编码
        const detection = jschardet.detect(fileBuffer);
        const encoding = detection.encoding || 'utf-8'; // 默认使用 utf-8

        // 将 Buffer 转换为字符串
        const content = iconv.decode(fileBuffer, encoding);

        return content;
        // 直接返回文件内容
        // return await fs.readFile(fullPath, 'utf-8');
      }
    } catch (error: any) {
      throw new Error(`获取文件内容失败: ${error.message}`);
    }
  }

  /**
   * 获取目录结构
   */
  async getDirectoryStructure(
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
          type: 'folder',
          path: relativePath,
          children
        });
      } else {
        const content = await this.getFileContent(dirPath, entry.name)
        structure.push({
          name: entry.name,
          type: 'file',
          path: relativePath,
          content
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

  async updateFiles(paths: IProject["paths"], data: FileStructure[]): Promise<void> {
    const developmentPath = paths.development;

    // 将获取到的数据写入 development 文件夹下
    for (const file of data) {
      const relativePath = file.path; // 相对路径
      const fullPath = path.join(developmentPath, relativePath);

      if (file.type === 'folder') {
          // 创建文件夹
          await fs.mkdir(fullPath, { recursive: true });

          // 递归处理子文件夹和文件
          if (file.children) {
              await this.updateFiles(paths , file.children);
          }
      } else if (file.type === 'file') {
          // 确保文件的父目录存在
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          // 写入文件内容
          await fs.writeFile(fullPath, file.content || "");
      }
    }
  } 
  //更新文件
  async handleFileOperations(developmentPath: string, messageId:string, codeArray: Array<{ path: string; content: string; type: 'add' | 'update' | 'delete' }>): Promise<void> {
    for (const file of codeArray) {
      const { path: filePath, content, type } = file;
      const fullPath = path.join(developmentPath, filePath); // 生成完整路径

      switch (type) {
          case 'delete':
              await fs.remove(fullPath); // 删除文件
              break;
          case 'add':
              await fs.outputFile(fullPath, content); // 新增文件
              break;
          case 'update':
              await fs.outputFile(fullPath, content); // 替代当前文件
              break;
          default:
              throw new Error(`Unsupported file operation type: ${type}`);
      }
    }
    const msgVersionPath = path.join(developmentPath.replace('development', ""), messageId)
    await fs.copy(developmentPath, msgVersionPath);
  }
} 