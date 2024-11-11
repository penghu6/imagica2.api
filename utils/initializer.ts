import { Express, Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger';
import { ServiceError, UnknownError } from '../utils/errors';
import { ControllerLoader } from './controllerLoader';
import { ControllerRegistry } from './controllerRegistry';
import { SwaggerSpec } from 'swagger-jsdoc';
import cors from 'cors';
import { formatResponse } from './tools';
import { createExpressServer } from 'routing-controllers';

export class Initializer {
  static async initialize(app: Express): Promise<void> {
    try {
      await this.initializeControllers(app);
      this.initializeSwagger(app);
      this.initializeErrorHandlers(app);
      createExpressServer({
        controllers: [__dirname + '/controllers/*.ts'],
      }).listen(3001); 
      await this.startServer(app);
    } catch (error) {
      console.error('初始化失败:', error);
      throw error;
    }
  }

  private static async initializeControllers(app: Express): Promise<void> {
    await ControllerLoader.loadControllers(
      app,
      path.join(__dirname, '../controllers')
    );
    
    if (process.env.NODE_ENV === 'development') {
      const routes = ControllerRegistry.getRoutes();
      routes.forEach(route => {
       // console.log(`${route.method.toUpperCase().padEnd(7)} ${route.path.padEnd(50)} -> ${route.controller}`);
      });
    }
  }

  private static initializeSwagger(app: Express): void {
    const spec = swaggerSpec as SwaggerSpec;
    
    console.log('Swagger API 文档路径:', spec.apis);
    console.log('已加载的模型:', Object.keys(spec.components?.schemas || {}));
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
    app.get('/swagger.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(spec);
    });
  }

  private static initializeErrorHandlers(app: Express): void {
    // 全局错误处理中间件
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      // 记录错误日志
      console.error('Global Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body
      });

      // 确保响应头未发送
      if (!res.headersSent) {
        // 发送错误响应
        return res.status(500).json(formatResponse(
          500,
          err.message || '服务器内部错误',
          null
        ));
      }

      // 如果响应头已发送，结束响应
      res.end();
    });

    // 处理未捕获的异常
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
    });

    // 处理未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason: any, promise) => {
      console.error('Unhandled Rejection:', reason);
    });
  }

  private static async startServer(app: Express): Promise<void> {
    const PORT = parseInt(process.env.PORT || '3000');
    app.listen(PORT, () => {
      console.log(`
服务器器启动成功！
- 本地访问: http://localhost:${PORT}
- API 文档: http://localhost:${PORT}/api-docs
- 环境模式: ${process.env.NODE_ENV}
      `);
    });
  }

  // private static initializeMiddlewares(app: Express): void {
  //   // CORS 配置
  //   const corsOptions = {
  //     origin: function (origin: any, callback: any) {
  //       // 允许的域名列表
  //       const whitelist = [
  //         'http://localhost:3000',
  //         'http://localhost:5173',
  //         'http://localhost:8080',
  //         'https://your-production-domain.com'
  //       ];
        
  //       if (!origin || whitelist.indexOf(origin) !== -1) {
  //         callback(null, true);
  //       } else {
  //         callback(new Error('不允许的跨域请求'));
  //       }
  //     },
  //     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  //     allowedHeaders: ['Content-Type', 'Authorization'],
  //     credentials: true,
  //     maxAge: 86400 // 预检请求缓存时间 24小时
  //   };

  //   // 应用 CORS 中间件
  //   app.use(cors(corsOptions));

  //   // 其他中间件配置...
  // }
}
