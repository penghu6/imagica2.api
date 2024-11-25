import jwt from 'jsonwebtoken';
import md5 from 'md5';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { UnknownError, ValidationError,SSLCheckError } from './errors';
import dns from 'dns';
import { promisify } from 'util';
import https from 'https';
import tls from 'tls';

/**
 * API 响应数据的标准格式接口
 * @template T 响应数据的类型
 */
export interface ApiResponse<T = Record<string, never>> {
  code: number;
  message: string;
  data: T;
}

/**
 * 格式化 API 响应数据
 * @template T 响应数据的类型
 * @param code 响应状态码 (例如：0-成功，-1-失败)
 * @param message 响应信息
 * @param data 响应数据（默认为空对象）
 * @returns 格式化后的响应对象
 * @example
 * // 成功响应带数据
 * formatResponse(0, '获取成功', { name: 'John' })
 * // 失败响应使用默认空对象
 * formatResponse(-1, '获取失败')
 */
export function formatResponse<T = Record<string, never>>(
  code: number, 
  message: string, 
  data: T = {} as T
): ApiResponse<T> {
  return {
    code,
    message,
    data
  };
}

// 解析客户端传递过来的 token
export function analysisToken(token: string): any {
  return jwt.verify(
    token.split(" ")[1],
    md5(process.env.JWT_SECRET || ''),
    (err, decode) => {
      if (err) {
        throw new ValidationError('Token verification failed');
      }
      return decode;
    }
  );
}

// 读取一个目录下有多少个文件
async function readDirLength(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(new ValidationError('Failed to read folder'));
      }
      resolve(files);
    });
  });
}

// 生成一个随机头像的路径
export async function randomAvatar(): Promise<string> {
  const files = await readDirLength("./public/static/avatar");
  const randomIndex = Math.floor(Math.random() * files.length);
  return "/static/avatar/" + files[randomIndex];
}

// 设置上传文件的引擎
const storage = multer.diskStorage({
  // 文件存储的位置
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/static/uploads"));
  },
  // 上传到服务器的文件，文件名要做单独处理
  filename: function (req, file, cb) {
    // 获取文件名
    const basename = path.basename(
      file.originalname,
      path.extname(file.originalname)
    );
    // 获取后缀名
    const extname = path.extname(file.originalname);
    // 构建新的名字
    const newName = basename + new Date().getTime() + Math.floor(Math.random() * 9000 + 1000) + extname;
    cb(null, newName);
  },
});

export const upload = multer({ storage });

/**
 * 验证指定的域名是否解析到目标地址
 * @param domain 要检查的域名
 * @param target 目标地址
 * @returns 返回域名是否正确解析到目标地址
 * @throws {DomainResolutionError} 当域名解析失败时抛出错误
 * @example
 * try {
 *   const isResolved = await checkDomainResolution('example.com', 'target.com');
 *   console.log(isResolved ? '解析正确' : '解析不匹配');
 * } catch (error) {
 *   console.error('域名解析检查失败:', error.message);
 * }
 */
export async function checkDomainResolution(domain: string, target: string): Promise<boolean> {
  if (!domain || !target) {
    throw new Error('域名和目标地址不能为空');
  }

  try {
    const records = await dns.promises.resolve(domain, 'A');
    const targetIp = await dns.promises.resolve(target, 'A');
    
    // 比较解析结果
    return records.some(record => targetIp.includes(record));
  } catch (error: any) {
    throw new Error(`域名解析检查失败: ${error.message}`);
  }
}

export const uploading = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/static/uploads'));
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
      files: 1
    },
    fileFilter: (req, file, cb) => {
      // 可以添加文件类型验证
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('不支持的文件类型'));
      }
    }
  });


/**
 * 检查域名的 SSL 证书状态
 * @param domain 需要检查的域名
 * @returns 返回证书是否有效
 * @throws {SSLCheckError} 当 SSL 检查失败时抛出错误
 * @example
 * try {
 *   const isValid = await checkSSLStatus('example.com');
 *   console.log(isValid ? 'SSL证书有效' : 'SSL证书无效');
 * } catch (error) {
 *   console.error('SSL检查失败:', error.message);
 * }
 */
export async function checkSSLStatus(domain: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const options = {
      host: domain,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false, // 允许自签名证书
    };

    const req = https.request(options, (res) => {
      const socket = res.socket as tls.TLSSocket;
      const cert = socket.getPeerCertificate(true);
      
      if (!cert || Object.keys(cert).length === 0) {
        reject(new SSLCheckError('无法获取SSL证书信息'));
        return;
      }

      // 检查证书是否有效
      const now = new Date();
      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      
      const isValid = socket.authorized && 
                     now >= validFrom && 
                     now <= validTo;

      resolve(isValid);
    });

    req.on('error', (error: Error) => {
      switch(error.message) {
        case 'ECONNREFUSED':
          reject(new SSLCheckError('无法连接到服务器'));
          break;
        case 'ENOTFOUND':
          reject(new SSLCheckError('域名不存在'));
          break;
        default:
          reject(new SSLCheckError(`SSL检查失败: ${error.message}`));
      }
    });

    // 设置请求超时
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new SSLCheckError('SSL检查超时'));
    });

    req.end();
  });
}