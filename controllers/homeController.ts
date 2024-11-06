import { Controller, Get, Param, Post } from '../decorators/controller';
import { BaseController } from './baseController';
import { Request } from 'express';

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: 首页相关接口
 */
@Controller('home')
export class HomeController extends BaseController {
  constructor() {
    super();
    // 调试日志
    //console.log('HomeController 路由:', Reflect.getMetadata('routes', this.constructor));
  }

  /**
   * @swagger
   * /home/{id}:
   *   get:
   *     summary: 获取首页信息
   *     tags: [Home]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: 记录ID
   *     responses:
   *       200:
   *         description: 成功返回
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 id:
   *                   type: integer
   *                   nullable: true
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: 参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /home/health:
   *   get:
   *     summary: 健康检查
   *     tags: [Home]
   *     responses:
   *       200:
   *         description: 服务正常运行
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 timestamp:
   *                   type: string
   *                   format: date-time
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
   * @swagger
   * /home/test:
   *   post:
   *     summary: 测试POST请求
   *     tags: [Home]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: 用户名
   *               age:
   *                 type: integer
   *                 description: 年龄
   *             required:
   *               - name
   *     responses:
   *       200:
   *         description: 成功返回
   *       401:
   *         description: 未授权
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