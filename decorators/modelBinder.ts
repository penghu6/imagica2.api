import { Request } from 'express';
import { ValidationError } from '../utils/errors';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * 模型绑定装饰器
 * @param model 模型类
 */
export function ModelBinder(model: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, ...args: any[]) {
      try {
        // 合并请求参数
        const data = {
          ...req.query,
          ...req.params,
          ...req.body
        };

        // 转换为模型实例
        const instance = plainToClass(model, data);

        // 验证
        const errors = await validate(instance);
        if (errors.length > 0) {
          throw new ValidationError(
            errors.map(error => Object.values(error.constraints || {})).flat().join(', ')
          );
        }

        // 调用原始方法，传入验证后的模型
        return await originalMethod.call(this, instance);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError('参数验证失败');
      }
    };

    return descriptor;
  };
} 