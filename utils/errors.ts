import { formatResponse } from './tools';

/**
 * 业务处理错误基类
 */
export class ServiceError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }

  // 格式化的返回错误信息
  toResponseJSON() {
    return formatResponse(this.code, this.message, null);
  }
}

// 文件上传错误
export class UploadError extends ServiceError {
  constructor(message: string) {
    super(message, 413);
  }
}

// 禁止访问错误
export class ForbiddenError extends ServiceError {
  constructor(message: string) {
    super(message, 401);
  }
}

// 验证错误
export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 406);
  }
}

// 无资源错误
export class NotFoundError extends ServiceError {
  constructor() {
    super("not found", 406);
  }
}

// 未知错误
export class UnknownError extends ServiceError {
  constructor() {
    super("server internal error", 500);
  }
} 

/**
 * SSL 证书检查错误
 */
export class SSLCheckError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SSLCheckError';
    }
  }
  