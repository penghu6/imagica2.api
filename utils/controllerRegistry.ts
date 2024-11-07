import { Express } from 'express';
import { BaseController } from '../controllers/baseController';

/**
 * 控制器注册信息接口
 */
interface ControllerInfo {
  constructor: any;
  instance?: BaseController;
  prefix: string;
}

/**
 * 控制器注册表
 * 负责管理所有控制器的注册和初始化
 */
export class ControllerRegistry {
  // 使用 Map 存储控制器信息
  private static controllers: Map<string, ControllerInfo> = new Map();

  /**
   * 注册控制器
   * @param constructor 控制器构造函数
   */
  static register(constructor: any): void {
    const name = constructor.name;
    const prefix = Reflect.getMetadata('prefix', constructor) || '';

    if (this.controllers.has(name)) {
      //console.warn(`控制器 ${name} 已经注册，将被覆盖`);
    }

    this.controllers.set(name, {
      constructor,
      prefix
    });

    //console.log(`控制器注册成功: ${name}, 路由前缀: ${prefix}`);
  }

  /**
   * 初始化所有已注册的控制器
   * @param app Express 应用实例
   */
  static initializeControllers(app: Express): void {
   // console.log('开始初始化控制器...');

    this.controllers.forEach((info, name) => {
      try {
        // 创建控制器实例
        const instance = new info.constructor();
        info.instance = instance;

        // 注册路由
        app.use('/', instance.router);

        console.log(`控制器 ${name} 初始化成功，路由前缀: ${info.prefix}`);

        // 输出注册的路由信息（可选）
        this.logRoutes(instance, info.prefix);
      } catch (error) {
        console.error(`控制器 ${name} 初始化失败:`, error);
      }
    });

    console.log('所有控制器初始化完成');
  }

  /**
   * 获取已注册的控制器信息
   */
  static getControllers(): Map<string, ControllerInfo> {
    return this.controllers;
  }

  /**
   * 获取指定控制器实例
   * @param name 控制器名称
   */
  static getController(name: string): BaseController | undefined {
    return this.controllers.get(name)?.instance;
  }

  /**
   * 检查控制器是否已注册
   * @param name 控制器名称
   */
  static hasController(name: string): boolean {
    return this.controllers.has(name);
  }

  /**
   * 移除控制器注册
   * @param name 控制器名称
   */
  static unregister(name: string): boolean {
    return this.controllers.delete(name);
  }

  /**
   * 清除所有控制器注册
   */
  static clear(): void {
    this.controllers.clear();
  }

  /**
   * 输出路由信息
   * @param controller 控制器实例
   * @param prefix 路由前缀
   */
  private static logRoutes(controller: BaseController, prefix: string): void {
    const routes = Reflect.getMetadata('routes', controller.constructor) || [];
    routes.forEach((route: any) => {
      console.log(`  ${route.method.toUpperCase()} ${prefix}${route.path}`);
    });
  }

  /**
   * 获取所有已注册的路由信息
   */
  static getRoutes(): Array<{
    controller: string;
    method: string;
    path: string;
  }> {
    const routes: Array<{
      controller: string;
      method: string;
      path: string;
    }> = [];

    this.controllers.forEach((info, controllerName) => {
      const controllerRoutes = Reflect.getMetadata('routes', info.constructor) || [];
      controllerRoutes.forEach((route: any) => {
        routes.push({
          controller: controllerName,
          method: route.method.toUpperCase(),
          path: `${info.prefix}${route.path}`
        });
      });
    });

    return routes;
  }

  /**
   * 验证控制器
   * @param constructor 控制器构造函数
   */
  private static validateController(constructor: any): boolean {
    // 确保继承自 BaseController
    if (!(constructor.prototype instanceof BaseController)) {
      throw new Error(`${constructor.name} 必须继承自 BaseController`);
    }

    // 确保有路由元数据
    const routes = Reflect.getMetadata('routes', constructor);
    if (!Array.isArray(routes)) {
      throw new Error(`${constructor.name} 没有定义任何路由`);
    }

    return true;
  }
} 