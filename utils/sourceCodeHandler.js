const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const { ValidationError } = require('./errors');

class SourceCodeHandler {
  constructor() {
    // 基础存储路径
    this.baseStoragePath = path.join(process.env.STORAGE_PATH || 'storage');
  }

  /**
   * 创建用户项目目录结构
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID
   * @returns {Object} 目录信息
   */
  async createProjectDirectories(userId, projectId) {
    const directories = {
      base: path.join(this.baseStoragePath, userId, projectId),
      source: path.join(this.baseStoragePath, userId, projectId, 'source'),
      builds: path.join(this.baseStoragePath, userId, projectId, 'builds'),
      deployments: path.join(this.baseStoragePath, userId, projectId, 'deployments')
    };

    // 创建所有必要的目录
    for (const dir of Object.values(directories)) {
      await fs.mkdir(dir, { recursive: true });
    }

    return directories;
  }

  /**
   * 处理ZIP源代码上传
   * @param {string} zipPath - 上传的ZIP文件路径
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID
   * @param {string} version - 版本号
   * @returns {Promise<Object>} 源代码信息
   */
  async processSourceCode(zipPath, userId, projectId, version) {
    try {
      // 创建项目目录结构
      const dirs = await this.createProjectDirectories(userId, projectId);
      
      // 创建版本目录
      const versionDir = path.join(dirs.source, version);
      await fs.mkdir(versionDir, { recursive: true });

      // 解压ZIP文件
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(versionDir, true);

      // 验证项目结构
      await this.validateProjectStructure(versionDir);

      // 获取源代码信息
      const sourceInfo = {
        path: versionDir,
        version: version,
        size: (await fs.stat(zipPath)).size,
        files: await this.getFileList(versionDir),
        timestamp: new Date(),
        checksum: await this.calculateChecksum(versionDir)
      };

      // 保存源代码信息
      await this.saveSourceInfo(dirs.base, sourceInfo);

      return sourceInfo;
    } catch (error) {
      throw new ValidationError('源代码处理失败：' + error.message);
    }
  }

  /**
   * 处理单文件上传
   * @param {string} tempPath - 临时文件路径
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID
   * @param {string} filePath - 文件相对路径
   * @returns {Promise<Object>} 文件信息
   */
  async processSingleFile(tempPath, userId, projectId, filePath) {
    try {
      // 创建项目目录结构
      const dirs = await this.createProjectDirectories(userId, projectId);
      
      // 构建目标文件路径
      const targetPath = path.join(dirs.source, 'current', filePath);
      
      // 确保目标目录存在
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      
      // 移动文件到目标位置
      await fs.rename(tempPath, targetPath);

      // 获取文件信息
      const stat = await fs.stat(targetPath);
      const fileInfo = {
        path: filePath,
        size: stat.size,
        lastModified: stat.mtime,
        checksum: await this.calculateFileChecksum(targetPath)
      };

      // 更新文件信息记录
      await this.updateFileInfo(dirs.base, filePath, fileInfo);

      return fileInfo;
    } catch (error) {
      throw new ValidationError('文件处理失败：' + error.message);
    }
  }

  /**
   * 验证项目结构
   * @param {string} projectDir - 项目目录
   */
  async validateProjectStructure(projectDir) {
    try {
      // 读取 package.json
      const packageJsonPath = path.join(projectDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      // 验证必要的字段
      if (!packageJson.name || !packageJson.version) {
        throw new Error('package.json 缺少必要的字段');
      }

      // 验证项目类型
      if (!await this.isValidProjectType(projectDir)) {
        throw new Error('不支持的项目类型');
      }
    } catch (error) {
      throw new Error(`项目验证失败: ${error.message}`);
    }
  }

  /**
   * 验证项目类型
   * @param {string} projectDir - 项目目录
   * @returns {Promise<boolean>} 是否为有效的项目类型
   */
  async isValidProjectType(projectDir) {
    // 检查常见的项目类型标识文件
    const typeIndicators = {
      'react': ['src/App.js', 'src/App.jsx'],
      'vue': ['src/App.vue'],
      'nextjs': ['next.config.js'],
      'html': ['index.html']
    };

    for (const [type, files] of Object.entries(typeIndicators)) {
      for (const file of files) {
        try {
          await fs.access(path.join(projectDir, file));
          return true;
        } catch (error) {
          continue;
        }
      }
    }

    return false;
  }

  /**
   * 获取文件列表
   * @param {string} dir - 目录路径
   * @returns {Promise<Array>} 文件列表
   */
  async getFileList(dir) {
    const files = await fs.readdir(dir);
    const fileList = [];

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

  /**
   * 计算目录内容的校验和
   * @param {string} dir - 目录路径
   * @returns {Promise<string>} 校验和
   */
  async calculateChecksum(dir) {
    const hash = crypto.createHash('sha256');
    const files = await this.getFileList(dir);

    for (const file of files.sort()) {
      const content = await fs.readFile(path.join(dir, file));
      hash.update(content);
    }

    return hash.digest('hex');
  }

  /**
   * 计算单个文件的校验和
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 校验和
   */
  async calculateFileChecksum(filePath) {
    const hash = crypto.createHash('sha256');
    const content = await fs.readFile(filePath);
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * 保存源代码信息
   * @param {string} baseDir - 基础目录
   * @param {Object} sourceInfo - 源代码信息
   */
  async saveSourceInfo(baseDir, sourceInfo) {
    const infoPath = path.join(baseDir, 'source-info.json');
    let allVersions = [];

    try {
      const existing = await fs.readFile(infoPath, 'utf-8');
      allVersions = JSON.parse(existing);
    } catch (error) {
      // 文件不存在，使用空数组
    }

    allVersions.push(sourceInfo);
    await fs.writeFile(infoPath, JSON.stringify(allVersions, null, 2));
  }

  /**
   * 更新文件信息记录
   * @param {string} baseDir - 基础目录
   * @param {string} filePath - 文件路径
   * @param {Object} fileInfo - 文件信息
   */
  async updateFileInfo(baseDir, filePath, fileInfo) {
    const infoPath = path.join(baseDir, 'files-info.json');
    let filesInfo = {};

    try {
      const existing = await fs.readFile(infoPath, 'utf-8');
      filesInfo = JSON.parse(existing);
    } catch (error) {
      // 文件不存在，使用空对象
    }

    filesInfo[filePath] = {
      ...fileInfo,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(infoPath, JSON.stringify(filesInfo, null, 2));
  }

  /**
   * 获取项目的所有版本信息
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 版本信息列表
   */
  async getProjectVersions(userId, projectId) {
    const baseDir = path.join(this.baseStoragePath, userId, projectId);
    const infoPath = path.join(baseDir, 'source-info.json');

    try {
      const content = await fs.readFile(infoPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取当前文件列表
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 文件信息
   */
  async getCurrentFiles(userId, projectId) {
    const baseDir = path.join(this.baseStoragePath, userId, projectId);
    const infoPath = path.join(baseDir, 'files-info.json');

    try {
      const content = await fs.readFile(infoPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  /**
   * 删除项目源代码
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID
   */
  async deleteProjectSource(userId, projectId) {
    const projectDir = path.join(this.baseStoragePath, userId, projectId);
    await fs.rm(projectDir, { recursive: true, force: true });
  }
}

module.exports = new SourceCodeHandler();



