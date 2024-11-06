import { Controller, Get, Param, Post } from '../decorators/controller';
import { BaseController } from './baseController';
import { Request } from 'express';

/**
 * 首页控制器
 * @class HomeController
 */
@Controller('home')
export class HomeController extends BaseController {
  constructor() {
    super();
    // 调试日志
    //console.log('HomeController 路由:', Reflect.getMetadata('routes', this.constructor));
  }

  /**
   * 首页
   * 支持以下访问方式：
   * GET /home?id=1
   * GET /home/1
   */
  @Get('/:id?')
  async index(
    @Param('id') id: number
  ) {
    return {
      message: "访问成功",
      id: id || null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * GET /home/detail/1
   * 自动映射到 /home/detail/:id
   */
  async detail(id: number) {
    return {
      id,
      detail: "详情信息"
    };
  }

  /**
   * 健康检查
   * GET /home/health
   */
  @Get('/health')
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取系统信息
   * GET /home/info
   */
  @Get('/info')
  async getInfo(req: Request) {
    return {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 测试POST请求
   * POST /home/test
   */
  @Post('/test')
  async testPost(req: Request) {
    const body = req.body;
    return {
      message: "POST请求成功",
      data: body,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取请求信息
   * GET /home/request-info
   */
  @Get('/request-info')
  async getRequestInfo(req: Request) {
    return {
      headers: req.headers,
      ip: req.ip,
      method: req.method,
      path: req.path,
      query: req.query,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取环境信息
   * GET /home/env
   */
  @Get('/env')
  async getEnv(req: Request) {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 测试错误处理
   * GET /home/error
   */
  @Get('/error')
  async testError(req: Request) {
    throw new Error('这是一个测试错误');
  }
} 