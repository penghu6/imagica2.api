import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API 文档',
      version: '1.0.0',
      description: '这是一个使用 Express + TypeScript 构建的 API',
      contact: {
        name: '开发团队',
        email: 'dev@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api',
        description: '开发服务器'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../controllers/**/*.ts'),
    path.join(__dirname, '../models/**/*.ts'),
    path.join(__dirname, '../case/**/*.ts')
  ]
};

export default swaggerJsdoc(options); 