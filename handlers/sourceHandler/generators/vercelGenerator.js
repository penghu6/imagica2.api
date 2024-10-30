const fs = require('fs').promises;
const path = require('path');
const Mustache = require('mustache');

class VercelGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/cicd/vercel');
  }

  /**
   * 生成 Vercel 配置文件
   * @param {string} targetPath - 目标路径
   * @param {Object} config - 配置信息
   */
  async generate(targetPath, config) {
    try {
      // 读取模板
      const configTemplate = await fs.readFile(
        path.join(this.templatesPath, 'config.json'),
        'utf8'
      );
      const buildTemplate = await fs.readFile(
        path.join(this.templatesPath, 'build.json'),
        'utf8'
      );

      // 生成配置内容
      const vercelConfig = Mustache.render(configTemplate, {
        ...config,
        projectId: `${config.userId}-${config.projectId}`,
        outputDirectory: config.outputDirectory || 'dist'
      });

      const buildConfig = Mustache.render(buildTemplate, {
        ...config,
        buildCommand: config.buildCommand || 'npm run build'
      });

      // 创建 .vercel 目录
      const vercelDir = path.join(targetPath, '.vercel');
      await fs.mkdir(vercelDir, { recursive: true });

      // 写入配置文件
      await fs.writeFile(
        path.join(vercelDir, 'project.json'),
        vercelConfig
      );
      await fs.writeFile(
        path.join(targetPath, 'vercel.json'),
        buildConfig
      );

      return {
        projectConfig: 'project.json',
        buildConfig: 'vercel.json'
      };
    } catch (error) {
      throw new Error(`生成 Vercel 配置失败: ${error.message}`);
    }
  }

  /**
   * 更新 Vercel 配置
   * @param {string} targetPath - 目标路径
   * @param {Object} config - 新配置
   */
  async updateConfig(targetPath, config) {
    return this.generate(targetPath, config);
  }
}

module.exports = new VercelGenerator();
