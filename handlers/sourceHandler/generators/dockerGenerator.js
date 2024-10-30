const fs = require('fs').promises;
const path = require('path');
const Mustache = require('mustache');

class DockerGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/docker');
  }

  /**
   * 生成 Docker 相关文件
   * @param {string} targetPath - 目标路径
   * @param {Object} config - 配置信息
   */
  async generate(targetPath, config) {
    // 读取模板
    const dockerfileTemplate = await fs.readFile(
      path.join(this.templatesPath, 'Dockerfile.nginx'),
      'utf8'
    );
    const nginxConfTemplate = await fs.readFile(
      path.join(this.templatesPath, 'nginx.conf'),
      'utf8'
    );

    // 生成文件内容
    const dockerfileContent = Mustache.render(dockerfileTemplate, config);
    const nginxConfContent = Mustache.render(nginxConfTemplate, config);

    // 写入文件
    await fs.writeFile(path.join(targetPath, 'Dockerfile'), dockerfileContent);
    await fs.writeFile(path.join(targetPath, 'nginx.conf'), nginxConfContent);

    return {
      dockerfile: 'Dockerfile',
      nginxConf: 'nginx.conf'
    };
  }
}

module.exports = new DockerGenerator();
