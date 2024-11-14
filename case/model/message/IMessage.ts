/**
 * 消息请求参数接口
 * 定义了从客户端接收的消息数据结构
 */
export type IMessageParam = Pick<
  IMessageResult,
  "devVersion" | "role" | "content" | "type"
>;

/**
 * 消息 API 响应结果接口
 * 定义了返回给客户端的消息数据结构
 */
export interface IMessageResult {
  messageId: string;
  projectId: string;
  devVersion: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "code" | "file" | "system";
  sequence: number;
  status: "pending" | "sent" | "error";
  createdAt: Date;
  updatedAt: Date;

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
    operation?: "create" | "update" | "delete";
  }>;

  metadata?: {
    aiModel?: string;
    tokens?: number;
    processingTime?: number;
  };

  parentId?: string;
  preserved: boolean;
}
