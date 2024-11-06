import { Express, Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger';
import { ServiceError, UnknownError } from '../utils/errors';
import { ControllerLoader } from './controllerLoader';
import { ControllerRegistry } from './controllerRegistry';

export class Initializer {
  static async initialize(app: Express): Promise<void> {
    try {
      await this.initializeControllers(app);
      this.initializeSwagger(app);
      this.initializeErrorHandlers(app);
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
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/swagger.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  private static initializeErrorHandlers(app: Express): void {
    app.use((req: Request, res: Response, next: NextFunction) => {
      next(createError(404));
    });

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      
      if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
      }

      if (err instanceof ServiceError) {
        res.status(err.code || 500).json(err.toResponseJSON());
      } else {
        const unknownError = new UnknownError();
        res.status(500).json(unknownError.toResponseJSON());
      }
    });
  }

  private static async startServer(app: Express): Promise<void> {
    const PORT = parseInt(process.env.PORT || '3000');
    app.listen(PORT, () => {
      console.log(`
服务器启动成功！
- 本地访问: http://localhost:${PORT}
- API 文档: http://localhost:${PORT}/api-docs
- 环境模式: ${process.env.NODE_ENV}
      `);
    });
  }
}
