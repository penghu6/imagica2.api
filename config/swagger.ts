import swaggerJsdoc from 'swagger-jsdoc';

interface SwaggerOptions {
  definition: {
    openapi: string;
    info: {
      title: string;
      version: string;
      description: string;
    };
    servers: Array<{
      url: string;
      description: string;
    }>;
    components: {
      securitySchemes: {
        bearerAuth: {
          type: string;
          scheme: string;
          bearerFormat: string;
        };
      };
    };
  };
  apis: string[];
}

const options: SwaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Imagica API 文档',
      version: '1.0.0',
      description: 'Imagica 项目管理系统 API 文档',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    './routes/*.ts',
    './models/*.ts',
    './controllers/*.ts'
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 