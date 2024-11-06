declare module 'swagger-jsdoc' {
  export interface SwaggerSpec {
    apis?: string[];
    components?: {
      schemas?: Record<string, any>;
    };
    paths?: Record<string, any>;
    openapi: string;
    info: {
      title: string;
      version: string;
      description?: string;
    };
  }

  export default function swaggerJsdoc(options: any): SwaggerSpec;
} 