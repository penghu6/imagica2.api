import 'reflect-metadata';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { setRouteConvention } from './decorators/routeConvention';
import { Initializer } from './utils/initializer';

import dotenv from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

import './db/init';

// 导入 projectService
import ProjectService from './services/projectService';
const projectService = new ProjectService();

const app = express();

// 使用 CORS 中间件
// app.use(cors({
//   origin: '*', // 允许的源
//   methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的 HTTP 方法
//   allowedHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
// }));

setRouteConvention({
  controllerNamePattern: 'Controller',
  routePrefix: '/api',
  parameterNameResolver: (name) => name.toLowerCase()
});

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    await Initializer.initialize(app);
  } catch (error) {
    console.error('应用初始化失败:', error);
    process.exit(1);
  }
})();

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器...');
  process.exit(0);
});

export default app; 