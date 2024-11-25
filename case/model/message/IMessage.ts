/**
 * 消息请求参数接口
 * 定义了从客户端接收的消息数据结构
 */
export type IMessageParam = Pick<
  IMessageResult,
  "devVersion" | "role" | "content" | "type"
>;
export enum MessageType {
  "text" ="text",
  "code" = "code",
  "file" = "file", 
  "system" = "system",
  "originContent" = "originContent",
  "handledContent" = "handledContent"
}

export enum MessageRole {
  "user" = "user",
  "assistant" = "assistant"
}

export interface needUpdateFilesType {
  path: string;
  content: string;
  type: "add" | "update" | "delete";
}
/**
 * 消息 API 响应结果接口
 * 定义了返回给客户端的消息数据结构
 */
export interface IMessageResult {
  messageId?: string;
  projectId: string;
  devVersion?: string;
  role: MessageRole;
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: {
      url: string;
    }
  }>;
  type: MessageType;
  // sequence: number;
  status?: "pending" | "sent" | "error";
  createdAt: number;
  // updatedAt: Date;

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
    // aiModel?: string;
    // tokens?: number;
    // processingTime?: number;
    needUpdateFiles?: Array<needUpdateFilesType>
  };

  parentId?: string;
  preserved?: boolean;
}
