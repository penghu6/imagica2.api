const fs = require('fs').promises;
const path = require('path');
const Mustache = require('mustache');

class CicdGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/cicd');
  }

  /**
   * 生成 CI/CD 配置文件
   * @param {string} targetPath - 目标路径
   * @param {string} platform - CI/CD 平台
   * @param {Object} config - 配置信息
   */
  async generate(targetPath, platform, config) {
    const templatePath = this.getTemplatePath(platform);
    const template = await fs.readFile(templatePath, 'utf8');
    const content = Mustache.render(template, config);

    const outputPath = this.getOutputPath(targetPath, platform);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);

    return {
      path: outputPath,
      platform,
      config
    };
  }

  /**
   * 获取模板路径
   * @param {string} platform - CI/CD 平台
   */
  getTemplatePath(platform) {
    const templates = {
      jenkins: path.join(this.templatesPath, 'jenkins/Jenkinsfile'),
      gitlab: path.join(this.templatesPath, 'gitlab/.gitlab-ci.yml'),
      github: path.join(this.templatesPath, 'github/workflows/deploy.yml')
    };

    if (!templates[platform]) {
      throw new Error(`不支持的 CI/CD 平台: ${platform}`);
    }

    return templates[platform];
  }

  /**
   * 获取输出路径
   * @param {string} targetPath - 目标路径
   * @param {string} platform - CI/CD 平台
   */
  getOutputPath(targetPath, platform) {
    const outputs = {
      jenkins: path.join(targetPath, 'Jenkinsfile'),
      gitlab: path.join(targetPath, '.gitlab-ci.yml'),
      github: path.join(targetPath, '.github/workflows/deploy.yml')
    };

    return outputs[platform];
  }
}

module.exports = new CicdGenerator();
