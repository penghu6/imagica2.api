import { Types } from 'mongoose';

/**
 * 消息 API 响应结果接口
 * 定义了返回给客户端的消息数据结构
 */
export interface IMessageResult {
  id: string;                    // 消息唯一标识
  projectId: string;             // 所属项目ID
  devVersion: string;            // 开发版本号
  role: 'user' | 'assistant';    // 消息角色：用户或AI助手
  content: string;               // 消息内容
  type: 'text' | 'code' | 'file' | 'system';  // 消息类型
  sequence: number;              // 消息序号，用于排序
  status: 'pending' | 'sent' | 'error';  // 消息状态
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
  
  // 代码片段相关信息
  codeSnippet?: {
    language: string;           // 编程语言
    code: string;              // 代码内容
    filePath?: string;         // 文件路径
    lineStart?: number;        // 代码起始行
    lineEnd?: number;          // 代码结束行
  };

  // 相关文件信息
  relatedFiles?: Array<{
    fileId: string;            // 文件ID
    relativePath: string;      // 相对路径
    operation?: 'create' | 'update' | 'delete';  // 文件操作类型
  }>;

  // AI处理相关的元数据
  metadata?: {
    aiModel?: string;          // 使用的AI模型
    tokens?: number;           // token使用量
    processingTime?: number;   // 处理时间(ms)
  };

  parentId?: string;           // 父消息ID，用于消息关联
  preserved?: boolean;         // 是否保留（版本回退时不删除）
}

/**
 * 消息创建参数接口
 * 定义了创建消息时需要的参数结构
 */
export interface IMessageParam {
  projectId: string | Types.ObjectId;  // 项目ID
  devVersion: string;                  // 开发版本号
  role: "user" | "assistant";         // 消息角色
  content: string;                     // 消息内容
  type: 'text' | 'code' | 'file' | 'system';  // 消息类型
  sequence?: number;                   // 消息序号（可选）
  
  // 其他可选字段与 IMessageResult 相同
  codeSnippet?: {
    language: string;
    code: string;
    filePath?: string;
    lineStart?: number;
    lineEnd?: number;
  };

  relatedFiles?: Array<{
    fileId: string;
    relativePath: string;
    operation?: 'create' | 'update' | 'delete';
  }>;

  metadata?: {
    aiModel?: string;
    tokens?: number;
    processingTime?: number;
  };

  parentId?: string;
  preserved?: boolean;
} 