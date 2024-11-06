import 'reflect-metadata';
import { Request } from 'express';

/**
 * 查询参数装饰器
 */
export function Query(paramName?: string) {
  return function (target: any, methodName: string, paramIndex: number) {
    Reflect.defineMetadata(`query:${methodName}:${paramIndex}`, paramName, target);
  };
}

/**
 * 路由参数装饰器
 */
export function Param(paramName?: string) {
  return function (target: any, methodName: string, paramIndex: number) {
    Reflect.defineMetadata(`param:${methodName}:${paramIndex}`, paramName, target);
  };
}

/**
 * 请求体装饰器
 */
export function Body(paramName?: string) {
  return function (target: any, methodName: string, paramIndex: number) {
    Reflect.defineMetadata(`body:${methodName}:${paramIndex}`, paramName, target);
  };
} 