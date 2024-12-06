import mongoose, { Schema, Document } from 'mongoose';
import path from 'path';
import { IMessageResult } from '../case/model/message/IMessage';
import { IProjectResult } from '../case/model/project/IProject';

/**
 * 项目接口定义
 * @interface IProject
 * @extends Document
 */
export interface IProject extends Document {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description?: string;
  /** 项目所有者ID */
  owner: mongoose.Types.ObjectId;
  /** 项目类型 */
  type: IProjectResult['type'];
  
  /** 
   * 项目路径管理
   * root: 项目根目录，格式: bucket/users/{userId}/projects/{projectId}
   * development: 开发目录，用于存放源代码
   */
  paths: {
    root: string;           
    development: string;    
  };
  /** 前端运行命令 */
  runCommand: string[];
  /** 
   * 开发版本管理
   * version: 版本号，如 dev-1, dev-2
   * description: 版本描述
   * snapshot: 版本快照信息
   */
  devVersions: Array<{
    version: string;        
    description: string;    
    createdAt: Date;
    snapshot: {
      path: string;        // 快照文件路径
      size: number;        // 快照文件大小
      etag: string;        // 文件标识
      lastModified: Date;  // 最后修改时间
    };
  }>;

  /** 
   * 文件映射表
   * 用于追踪项目中的文件状态和同步情况
   */
  fileMapping: Array<{
    id: string;            // 文件唯一标识
    relativePath: string;  // 相对项目根目录的路径
    hash: string;          // 文件内容的哈希值
    lastModified: Date;    // 最后修改时间
    lastSyncTime: Date;    // 最后同步时间
    status: 'synced' | 'modified' | 'conflict';  // 文件状态
  }>;

  /** 
   * 聊天记录
   * 记录用户与AI助手的对话历史
   * 直接使用 IMessageResult 类型保持一致性, 去掉 chatHistory 名字，改为 messages，这样减少歧义
   */
  messages: Array<IMessageResult>;

  /** 当前开发版本号 */
  currentDevVersion: string;
  /** 项目标签 */
  tags: string[];
  /** 项目状态 */
  status: 'development' | 'completed';
  /** 用户界面状态 */
  uiState: IProjectResult['uiState'];

  /** 发布设置 */
  publishSettings: IProjectResult['publishSettings'];
  
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 项目版本 1，2 */
  version: number;
}

/**
 * Mongoose Schema 定义
 */
const projectSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, '项目名称不能为空'],
    trim: true,
    maxlength: [100, '项目名称不能超过100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '项目描述不能超过500个字符']
  },
  owner: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['react', 'vue', 'html', 'nextjs', 'upload'],
    required: true
  },
  paths: {
    root: String,
    development: String
  },
  runCommand: { 
    type: [String],
    default: [] 
  },
  devVersions: [{
    version: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
    snapshot: {
      path: String,
      size: Number,
      etag: String,
      lastModified: Date
    }
  }],
  fileMapping: [{
    id: String,
    relativePath: String,
    hash: String,
    lastModified: Date,
    lastSyncTime: Date,
    status: {
      type: String,
      enum: ['synced', 'modified', 'conflict'],
      default: 'synced'
    }
  }],
  messages: [{
    messageId: { 
      type: String,
    },
    devVersion: String,
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: Schema.Types.Mixed, // 使用 Mixed 类型以支持多种结构
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'code', 'file', 'system'],
      default: 'text'
    },
    sequence: Number,
    status: {
      type: String,
      enum: ['pending', 'sent', 'error'],
      default: 'pending'
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
    metadata: {
      needUpdateFiles: [{
        path: { type: String, required: true }, // 文件路径
        type: { type: String, enum: ['add', 'update', 'delete'], required: true } // 操作类型
      }]
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    preserved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Number
    }
  }],
  currentDevVersion: String,
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['development', 'completed'],
    default: 'development'
  },
  /** 用户界面状态 */
  uiState: {
    type: Schema.Types.Mixed,
    default: {}
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,  // 自动管理 createdAt 和 updatedAt
  toJSON: { virtuals: true },  // 序列化时包含虚拟字段
  toObject: { virtuals: true }
});

const ProjectModel = mongoose.model<IProject>('Project', projectSchema);

export default ProjectModel;
