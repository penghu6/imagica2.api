import mongoose, { Schema, Document } from 'mongoose';

/**
 * 消息接口定义
 * @interface IMessage
 * @extends Document
 */
export interface IMessage extends Document {
  /** 项目ID */
  projectId: mongoose.Types.ObjectId;
  
  /** 开发版本号 */
  devVersion: string;
  
  /** 消息发送者角色 */
  role: 'user' | 'assistant';
  
  /** 消息内容 */
  content: string;
  
  /** 消息类型 */
  type: 'text' | 'code' | 'file' | 'system';
  
  /** 代码片段（当type为code时） */
  codeSnippet?: {
    language: string;
    code: string;
    filePath?: string;
    lineStart?: number;
    lineEnd?: number;
  };
  
  /** 相关文件 */
  relatedFiles?: Array<{
    fileId: string;
    relativePath: string;
    operation?: 'create' | 'update' | 'delete';
  }>;
  
  /** 消息状态 */
  status: 'pending' | 'sent' | 'error';
  
  /** 是否在版本回退时保留 */
  preserved: boolean;
  
  /** 父消息ID（用于消息引用） */
  parentId?: mongoose.Types.ObjectId;
  
  /** 消息序号（用于排序） */
  sequence: number;
  
  /** 元数据 */
  metadata?: {
    aiModel?: string;
    tokens?: number;
    processingTime?: number;
  };
}

const messageSchema: Schema = new Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  devVersion: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'code', 'file', 'system'],
    default: 'text'
  },
  codeSnippet: {
    language: String,
    code: String,
    filePath: String,
    lineStart: Number,
    lineEnd: Number
  },
  relatedFiles: [{
    fileId: String,
    relativePath: String,
    operation: {
      type: String,
      enum: ['create', 'update', 'delete']
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'sent', 'error'],
    default: 'pending'
  },
  preserved: {
    type: Boolean,
    default: false
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  sequence: {
    type: Number,
    required: false
  },
  metadata: {
    aiModel: String,
    tokens: Number,
    processingTime: Number
  }
}, {
  timestamps: true
});

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);

export default MessageModel;
