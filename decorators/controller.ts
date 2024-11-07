import 'reflect-metadata';
import { Router, Request, Response, NextFunction } from 'express';
import { ControllerRegistry } from '../utils/controllerRegistry';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RouteConfig {
  path: string;
  method: HttpMethod;
  methodName: string | symbol;
  handler: Function;
}

export function Controller(prefixOrOptions?: string) {
  return function (target: any) {
    const routePrefix = '/api';
    const prefix = prefixOrOptions 
      ? `${routePrefix}/${prefixOrOptions}` 
      : `${routePrefix}/${target.name.replace('Controller', '').toLowerCase()}`;

    // 规范化路径
    const normalizedPrefix = '/' + prefix.replace(/^\/+|\/+$/g, '');
    
    Reflect.defineMetadata('prefix', normalizedPrefix, target);
    
    // 确保路由元数据存在
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }

    // 注册控制器
    ControllerRegistry.register(target);
  };
}

function createMethodDecorator(method: HttpMethod) {
  return function (path: string) {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
      const routes: RouteConfig[] = Reflect.getMetadata('routes', target.constructor) || [];
      
      const originalMethod = descriptor.value;
      const handler = async function(this: any, req: Request, res: Response, next: NextFunction) {
        try {
          const paramNames = getParameterNames(originalMethod);
          const args = paramNames.map(name => {
            if (req.query && req.query[name] !== undefined) {
              return req.query[name];
            }
            if (req.body && req.body[name] !== undefined) {
              return req.body[name];
            }
            if (req.params && req.params[name] !== undefined) {
              return req.params[name];
            }
            return undefined;
          });
          
          const result = await originalMethod.apply(this, args);
          res.json(result);
        } catch (error) {
          next(error);
        }
      };

      routes.push({
        path: path.startsWith('/') ? path : `/${path}`,
        method,
        methodName: propertyKey,
        handler
      });

      Reflect.defineMetadata('routes', routes, target.constructor);
      return descriptor;
    };
  };
}

function getParameterNames(func: Function): string[] {
  const fnStr = func.toString().replace(/[\r\n\s]+/g, ' ');
  const result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).split(',');
  return result.map(param => param.trim()).filter(Boolean);
}

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');
export const Patch = createMethodDecorator('patch');