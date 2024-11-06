import 'reflect-metadata';
import { Router, Request, Response, NextFunction } from 'express';
import { ControllerRegistry } from '../utils/controllerRegistry';

// 路由方法类型
export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

// 路由配置接口
export interface RouteConfig {
  path: string;
  method: HttpMethod;
  methodName: string | symbol;
  handler: Function;
}

// 控制器装饰器
export function Controller(prefixOrOptions?: string) {
  return function (target: any) {
    const routePrefix = Reflect.getMetadata('routePrefix', Reflect) || '/api';
    
    let prefix = '';
    if (prefixOrOptions) {
      prefix = `${routePrefix}/${prefixOrOptions}`;
    } else {
      const controllerName = target.name.replace('Controller', '').toLowerCase();
      prefix = `${routePrefix}/${controllerName}`;
    }

    // 确保前缀格式正确
    prefix = prefix.replace(/\/+/g, '/');  // 处理多余的斜杠
    if (!prefix.startsWith('/')) {
      prefix = '/' + prefix;
    }
    
    Reflect.defineMetadata('prefix', prefix, target);
    
    // 确保路由元数据存在
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }

    // 注册控制器
    ControllerRegistry.register(target);
  };
}

// HTTP 方法装饰器工厂
function createMethodDecorator(method: HttpMethod) {
  return function (path: string = ''): MethodDecorator {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
        try {
          const params = await resolveParams(req, target, propertyKey.toString());
          const result = await originalMethod.apply(this, params);
          res.json(result);
        } catch (error) {
          next(error);
        }
      };

      // 注册路由
      const routes = Reflect.getMetadata('routes', target.constructor) || [];
      routes.push({
        path,
        method,
        methodName: propertyKey,
        handler: descriptor.value
      });

      Reflect.defineMetadata('routes', routes, target.constructor);
      return descriptor;
    };
  };
}

// HTTP 方法装饰器
export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');
export const Patch = createMethodDecorator('patch');

// 参数装饰器
export function Param(paramName?: string) {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    if (propertyKey === undefined) {
      throw new Error('PropertyKey cannot be undefined');
    }
    
    Reflect.defineMetadata(
      `param:${propertyKey.toString()}:${parameterIndex}`,
      paramName || '',
      target.constructor
    );
  };
}

// 参数解析函数
async function resolveParams(req: Request, target: any, methodName: string): Promise<any[]> {
  const paramTypes = Reflect.getMetadata('design:paramtypes', target, methodName);
  if (!paramTypes) return [];

  const params: any[] = [];
  
  for (let i = 0; i < paramTypes.length; i++) {
    const paramName = Reflect.getMetadata(`param:${methodName}:${i}`, target.constructor);
    const value = await resolveParamValue(req, paramName, paramTypes[i]);
    params.push(value);
  }

  return params;
}

// 参数值解析函数
async function resolveParamValue(req: Request, paramName: string, paramType: any): Promise<any> {
  const value = 
    req.params[paramName] ||
    req.query[paramName] ||
    req.body?.[paramName];

  if (value === undefined) return undefined;
  
  switch (paramType) {
    case Number:
      return Number(value);
    case Boolean:
      return Boolean(value);
    case Date:
      return new Date(value);
    default:
      return value;
  }
}