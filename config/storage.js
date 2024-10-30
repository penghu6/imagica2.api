const path = require('path');

const rootDir = process.cwd();

module.exports = {
  bucket: {
    root: path.join(rootDir, process.env.FILE_PATH || 'bucket'),
    temp: path.join(rootDir, process.env.STORAGE_TEMP || 'bucket/temp')
  }
};

// 确保目录存在
const fs = require('fs').promises;
(async () => {
  try {
    await fs.mkdir(module.exports.bucket.root, { recursive: true });
    await fs.mkdir(module.exports.bucket.temp, { recursive: true });
    console.log('存储目录已创建');
  } catch (error) {
    console.error('创建存储目录失败:', error);
  }
})();