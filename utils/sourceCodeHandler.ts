import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import crypto from 'crypto';
import { ValidationError } from './errors';

interface SourceInfo {
  path: string;
  version: string;
  size: number;
  files: string[];
  timestamp: Date;
  checksum: string;
}

interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
  checksum: string;
  updatedAt?: string;
}

interface Directories {
  base: string;
  source: string;
  builds: string;
  deployments: string;
}

interface PackageJson {
  name: string;
  version: string;
}

class SourceCodeHandler {
  private baseStoragePath: string;
  private readonly typeIndicators: Record<string, string[]> = {
    'react': ['src/App.js', 'src/App.jsx'],
    'vue': ['src/App.vue'],
    'nextjs': ['next.config.js'],
    'html': ['index.html']
  };

  constructor() {
    this.baseStoragePath = path.join(process.env.STORAGE_PATH || 'storage');
  }

  async createProjectDirectories(userId: string, projectId: string): Promise<Directories> {
    const directories: Directories = {
      base: path.join(this.baseStoragePath, userId, projectId),
      source: path.join(this.baseStoragePath, userId, projectId, 'source'),
      builds: path.join(this.baseStoragePath, userId, projectId, 'builds'),
      deployments: path.join(this.baseStoragePath, userId, projectId, 'deployments')
    };

    for (const dir of Object.values(directories)) {
      await fs.mkdir(dir, { recursive: true });
    }

    return directories;
  }

  async processSourceCode(zipPath: string, userId: string, projectId: string, version: string): Promise<SourceInfo> {
    try {
      const dirs = await this.createProjectDirectories(userId, projectId);
      const versionDir = path.join(dirs.source, version);
      await fs.mkdir(versionDir, { recursive: true });

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(versionDir, true);

      await this.validateProjectStructure(versionDir);

      const sourceInfo: SourceInfo = {
        path: versionDir,
        version: version,
        size: (await fs.stat(zipPath)).size,
        files: await this.getFileList(versionDir),
        timestamp: new Date(),
        checksum: await this.calculateChecksum(versionDir)
      };

      await this.saveSourceInfo(dirs.base, sourceInfo);
      return sourceInfo;
    } catch (error: any) {
      throw new ValidationError('源代码处理失败：' + error.message);
    }
  }

  async processSingleFile(tempPath: string, userId: string, projectId: string, filePath: string): Promise<FileInfo> {
    try {
      const dirs = await this.createProjectDirectories(userId, projectId);
      const targetPath = path.join(dirs.source, 'current', filePath);
      
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.rename(tempPath, targetPath);

      const stat = await fs.stat(targetPath);
      const fileInfo: FileInfo = {
        path: filePath,
        size: stat.size,
        lastModified: stat.mtime,
        checksum: await this.calculateFileChecksum(targetPath)
      };

      await this.updateFileInfo(dirs.base, filePath, fileInfo);
      return fileInfo;
    } catch (error: any) {
      throw new ValidationError('文件处理失败：' + error.message);
    }
  }

  private async validateProjectStructure(projectDir: string): Promise<void> {
    try {
      const packageJsonPath = path.join(projectDir, 'package.json');
      const packageJson: PackageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      if (!packageJson.name || !packageJson.version) {
        throw new Error('package.json 缺少必要的字段');
      }

      if (!await this.isValidProjectType(projectDir)) {
        throw new Error('不支持的项目类型');
      }
    } catch (error: any) {
      throw new Error(`项目验证失败: ${error.message}`);
    }
  }

  private async isValidProjectType(projectDir: string): Promise<boolean> {
    for (const files of Object.values(this.typeIndicators)) {
      for (const file of files) {
        try {
          await fs.access(path.join(projectDir, file));
          return true;
        } catch {
          continue;
        }
      }
    }
    return false;
  }

  private async getFileList(dir: string): Promise<string[]> {
    const files = await fs.readdir(dir);
    const fileList: string[] = [];

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        const subFiles = await this.getFileList(filePath);
        fileList.push(...subFiles);
      } else {
        fileList.push(filePath.replace(dir + path.sep, ''));
      }
    }

    return fileList;
  }

  private async calculateChecksum(dir: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const files = await this.getFileList(dir);

    for (const file of files.sort()) {
      const content = await fs.readFile(path.join(dir, file));
      hash.update(content);
    }

    return hash.digest('hex');
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const content = await fs.readFile(filePath);
    hash.update(content);
    return hash.digest('hex');
  }

  private async saveSourceInfo(baseDir: string, sourceInfo: SourceInfo): Promise<void> {
    const infoPath = path.join(baseDir, 'source-info.json');
    let allVersions: SourceInfo[] = [];

    try {
      const existing = await fs.readFile(infoPath, 'utf-8');
      allVersions = JSON.parse(existing);
    } catch {
      // 文件不存在，使用空数组
    }

    allVersions.push(sourceInfo);
    await fs.writeFile(infoPath, JSON.stringify(allVersions, null, 2));
  }

  private async updateFileInfo(baseDir: string, filePath: string, fileInfo: FileInfo): Promise<void> {
    const infoPath = path.join(baseDir, 'files-info.json');
    let filesInfo: Record<string, FileInfo> = {};

    try {
      const existing = await fs.readFile(infoPath, 'utf-8');
      filesInfo = JSON.parse(existing);
    } catch {
      // 文件不存在，使用空对象
    }

    filesInfo[filePath] = {
      ...fileInfo,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(infoPath, JSON.stringify(filesInfo, null, 2));
  }

  async getProjectVersions(userId: string, projectId: string): Promise<SourceInfo[]> {
    const baseDir = path.join(this.baseStoragePath, userId, projectId);
    const infoPath = path.join(baseDir, 'source-info.json');

    try {
      const content = await fs.readFile(infoPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async getCurrentFiles(userId: string, projectId: string): Promise<Record<string, FileInfo>> {
    const baseDir = path.join(this.baseStoragePath, userId, projectId);
    const infoPath = path.join(baseDir, 'files-info.json');

    try {
      const content = await fs.readFile(infoPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  async deleteProjectSource(userId: string, projectId: string): Promise<void> {
    const projectDir = path.join(this.baseStoragePath, userId, projectId);
    await fs.rm(projectDir, { recursive: true, force: true });
  }
}

export default new SourceCodeHandler();
