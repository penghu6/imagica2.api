import { Router, RequestHandler } from 'express';
import { HttpMethod, RouteConfig } from '../decorators/controller';

/**
 * 基础控制器
 */
export class BaseController {
  public router: Router;
  
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // 获取控制器的前缀
    const prefix = Reflect.getMetadata('prefix', this.constructor);
    if (!prefix) {
      throw new Error(`No prefix defined for ${this.constructor.name}`);
    }
    
    // 获取所有路由配置
    const routes: RouteConfig[] = Reflect.getMetadata('routes', this.constructor) || [];

    routes.forEach(({ path, method, handler }) => {
      const fullPath = path.startsWith('/') 
        ? `/${prefix}${path}`
        : `/${prefix}/${path}`;
        
      // 规范化路径，移除多余的斜杠
      const normalizedPath = fullPath.replace(/\/+/g, '/');
      
      // 使用类型安全的方式调用路由方法
      switch (method) {
        case 'get':
          this.router.get(normalizedPath, handler.bind(this));
          break;
        case 'post':
          this.router.post(normalizedPath, handler.bind(this));
          break;
        case 'put':
          this.router.put(normalizedPath, handler.bind(this));
          break;
        case 'delete':
          this.router.delete(normalizedPath, handler.bind(this));
          break;
        case 'patch':
          this.router.patch(normalizedPath, handler.bind(this));
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    });
  }
}
