import fs from 'fs';
import path from 'path';
import { Express } from 'express';
import { ControllerRegistry } from './controllerRegistry';

export class ControllerLoader {
  /**
   * 自动加载并注册所有控制器
   * @param app Express 应用实例
   * @param controllersPath 控制器目录路径
   */
  static async loadControllers(app: Express, controllersPath: string): Promise<void> {
    try {
      // 确保目录存在
      if (!fs.existsSync(controllersPath)) {
        console.error(`控制器目录不存在: ${controllersPath}`);
        return;
      }

     // console.log(`开始加载控制器，目录: ${controllersPath}`);
      
      // 递归读取所有控制器文件
      const controllerFiles = this.getControllerFiles(controllersPath);
      
      // 加载每个控制器文件
      for (const file of controllerFiles) {
        try {
          const relativePath = path.relative(__dirname, file);
          //console.log(`加载控制器: ${relativePath}`);
          
          // 动态导入控制器
          await import(file);
        } catch (error) {
          console.error(`加载控制器失败 ${file}:`, error);
        }
      }

      // 初始化所有已注册的控制器
      //console.log('初始化所有控制器...');
      ControllerRegistry.initializeControllers(app);
      
      //console.log('控制器加载完成！');
    } catch (error) {
      console.error('加载控制器过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 递归获取所有控制器文件
   * @param dir 目录路径
   * @returns 控制器文件路径数组
   */
  private static getControllerFiles(dir: string): string[] {
    let results: string[] = [];
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // 递归处理子目录
        results = results.concat(this.getControllerFiles(filePath));
      } else if (this.isControllerFile(file)) {
        results.push(filePath);
      }
    });

    return results;
  }

  /**
   * 判断是否为控制器文件
   * @param filename 文件名
   * @returns boolean
   */
  private static isControllerFile(filename: string): boolean {
    return (
      (filename.endsWith('Controller.ts') || filename.endsWith('Controller.js')) &&
      !filename.endsWith('.d.ts') && // 排除类型定义文件
      !filename.endsWith('.test.ts') && // 排除测试文件
      !filename.endsWith('.spec.ts')
    );
  }
} 