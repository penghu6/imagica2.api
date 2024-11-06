import 'reflect-metadata';

export interface RouteConvention {
  controllerNamePattern?: string;  // 控制器命名约定，例如: '*Controller'
  routePrefix?: string;            // 路由前缀，例如: 'api'
  parameterNameResolver?: (paramName: string) => string; // 参数名称解析器
}

export const defaultConvention: RouteConvention = {
  controllerNamePattern: 'Controller',
  routePrefix: '',
  parameterNameResolver: (paramName: string) => paramName.toLowerCase()
};

// 设置全局约定
export function setRouteConvention(convention: Partial<RouteConvention>) {
  Object.assign(defaultConvention, convention);
} 