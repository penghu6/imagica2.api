import path from 'path';
import { promises as fs } from 'fs';

const rootDir = process.cwd();

const bucket = {
  root: path.join(rootDir, process.env.FILE_PATH || 'bucket'),
  temp: path.join(rootDir, process.env.STORAGE_TEMP || 'bucket/temp')
};

// 确保目录存在
(async () => {
  try {
    await fs.mkdir(bucket.root, { recursive: true });
    await fs.mkdir(bucket.temp, { recursive: true });
    console.log('存储目录已创建');
  } catch (error) {
    console.error('创建存储目录失败:', error);
  }
})();

export { bucket };
