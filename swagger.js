const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API 文档',
      version: '1.0.0',
      description: '这是一个简单的 API 文档示例',
    },
  },
  apis: ['./routes/*.js'], // 指定路由文件路径
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 