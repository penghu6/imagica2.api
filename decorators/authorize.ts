import { Request, Response, NextFunction } from 'express';
import { analysisToken } from '../utils/tools';
import {ForbiddenError} from '../utils/errors';

/**
 * 授权装饰器
 */
export function Authorize() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        // 验证 token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          throw new ForbiddenError('未提供访问令牌');
        }

        const decoded = await analysisToken(token);
        if (!decoded) {
          throw new ForbiddenError('无效的访问令牌');
        }

        // 将解码后的用户信息添加到请求对象
       // req.user = decoded;

        // 调用原始方法
        return await originalMethod.call(this, req, res, next);
      } catch (error) {
        next(error);
      }
    };

    return descriptor;
  };
}
