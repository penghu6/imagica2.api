/**
 * 该文件负责连接数据库
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 确保环境变量被加载
dotenv.config();

// 设置 strictQuery 选项
mongoose.set('strictQuery', false);

// 定义链接数据库字符串，包含用户名和密码
const dbURI = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;

if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('请在 .env 文件中设置 DB_HOST, DB_NAME, DB_USER 和 DB_PASSWORD');
  process.exit(1);
}

// 连接数据库
mongoose.connect(dbURI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
});

// 监听连接事件
mongoose.connection.on('connected', () => {
  console.log(`${process.env.DB_NAME} 数据库已经连接...`);
});

// 监听错误事件
mongoose.connection.on('error', (err: Error) => {
  console.error('数据库连接错误:', err);
  process.exit(1);
});

// 监听断开连接事件
mongoose.connection.on('disconnected', () => {
  console.log('数据库连接已断开');
});

// 应用程序终止时关闭数据库连接
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});

export default mongoose;
