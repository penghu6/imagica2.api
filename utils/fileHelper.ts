import fs from 'fs';
import path from 'path';

/**
 * 创建基于日期时间的目录路径
 * 格式：YYYYMMDDHHMMSS
 */
export const createDatePath = () => {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${
    now.getDate().toString().padStart(2, '0')}${
    now.getHours().toString().padStart(2, '0')}${
    now.getMinutes().toString().padStart(2, '0')}${
    now.getSeconds().toString().padStart(2, '0')}`;
};

/**
 * 确保目录存在，如果不存在则创建
 * @param dirPath 目录路径
 */
export const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * 获取文件访问路径
 * @param filePath 文件物理路径
 * @param basePath 基础路径
 * @returns 可访问的URL路径
 */
export const getAccessPath = (filePath: string, basePath: string) => {
  const relativePath = path.relative(basePath, filePath);
  return '/static/' + relativePath.replace(/\\/g, '/');
};

export const getRealPath = (filePath: string, basePath: string) => {
  const relativePath = filePath.replace(/^\/statoc/, "")
  const realPath = path.join(basePath, relativePath);
  return relativePath.replace(/\\/g, '/');
};
