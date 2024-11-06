import 'reflect-metadata';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { setRouteConvention } from './decorators/routeConvention';
import { Initializer } from './utils/initializer';

import dotenv from 'dotenv';
dotenv.config();

import './db/init';

const app = express();

setRouteConvention({
  controllerNamePattern: 'Controller',
  routePrefix: 'api',
  parameterNameResolver: (name) => name.toLowerCase()
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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