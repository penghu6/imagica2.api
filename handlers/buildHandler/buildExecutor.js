const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const buildLogger = require('./buildLogger');

class BuildExecutor {
  /**
   * 获取项目的包管理器类型
   * @param {string} buildDir - 构建目录
   * @returns {string} 包管理器类型
   */
  async detectPackageManager(buildDir) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      // 检查 yarn.lock
      if (await fs.access(path.join(buildDir, 'yarn.lock')).then(() => true).catch(() => false)) {
        return 'yarn';
      }
      // 检查 pnpm-lock.yaml
      if (await fs.access(path.join(buildDir, 'pnpm-lock.yaml')).then(() => true).catch(() => false)) {
        return 'pnpm';
      }
      // 默认使用 npm
      return 'npm';
    } catch (error) {
      return 'npm';
    }
  }

  /**
   * 获取构建命令
   * @param {string} buildDir - 构建目录
   * @returns {Promise<Object>} 构建命令配置
   */
  async getBuildCommands(buildDir) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(buildDir, 'package.json'), 'utf8')
      );

      // 获取项目配置的构建命令
      const buildScript = packageJson.scripts?.build || 'build';
      
      // 根据包管理器返回对应的命令
      const packageManager = await this.detectPackageManager(buildDir);
      
      const commands = {
        npm: {
          install: 'npm install',
          build: `npm run ${buildScript}`
        },
        yarn: {
          install: 'yarn install',
          build: `yarn ${buildScript}`
        },
        pnpm: {
          install: 'pnpm install',
          build: `pnpm ${buildScript}`
        }
      };

      return commands[packageManager];
    } catch (error) {
      throw new Error(`获取构建命令失败: ${error.message}`);
    }
  }

  /**
   * 执行构建
   * @param {string} buildDir - 构建目录
   * @param {string} buildId - 构建ID
   */
  async execute(buildDir, buildId) {
    try {
      buildLogger.log(buildId, 'info', '开始构建');

      // 获取构建命令
      const commands = await this.getBuildCommands(buildDir);

      // 安装依赖
      await this.installDependencies(buildDir, buildId, commands.install);

      // 执行构建
      await this.runBuild(buildDir, buildId, commands.build);

      buildLogger.log(buildId, 'info', '构建完成');
      return true;
    } catch (error) {
      buildLogger.log(buildId, 'error', `构建失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 执行构建命令
   * @param {string} buildDir - 构建目录
   * @param {string} buildId - 构建ID
   */
  async runBuild(buildDir, buildId) {
    buildLogger.log(buildId, 'info', '开始执行构建命令');
    try {
      const { stdout, stderr } = await execAsync('npm run build', { cwd: buildDir });
      buildLogger.log(buildId, 'info', '构建命令执行完成', { stdout, stderr });
    } catch (error) {
      buildLogger.log(buildId, 'error', '构建命令执行失败');
      throw error;
    }
  }
}

module.exports = new BuildExecutor();
