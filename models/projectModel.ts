import mongoose, { Schema, Document } from 'mongoose';
import path from 'path';

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
  type: 'react' | 'vue' | 'html' | 'nextjs';
  
  /** 
   * 项目路径管理
   * root: 项目根目录，格式: bucket/users/{userId}/projects/{projectId}
   * development: 开发目录，用于存放源代码
   */
  paths: {
    root: string;           
    development: string;    
  };

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
   */
  chatHistory: Array<{
    messageId: mongoose.Types.ObjectId;
    devVersion: String,
    timestamp: Date,
    role: String,
    content: String,
    relatedFiles: [String],
    preserved: Boolean
  }>;

  /** 当前开发版本号 */
  currentDevVersion: string;
  /** AI是否正在响应 */
  isAITyping: boolean;
  /** 项目标签 */
  tags: string[];
  /** 项目状态 */
  status: 'development' | 'completed';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
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
    enum: ['react', 'vue', 'html', 'nextjs'],
    required: true
  },
  paths: {
    root: String,
    development: String
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
  chatHistory: [{
    messageId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Message' 
    },
    devVersion: String,
    timestamp: Date,
    role: {
      type: String,
      enum: ['user', 'assistant']
    },
    content: String,
    relatedFiles: [String],
    preserved: Boolean
  }],
  currentDevVersion: String,
  isAITyping: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['development', 'completed'],
    default: 'development'
  }
}, {
  timestamps: true,  // 自动管理 createdAt 和 updatedAt
  toJSON: { virtuals: true },  // 序列化时包含虚拟字段
  toObject: { virtuals: true }
});

const ProjectModel = mongoose.model<IProject>('Project', projectSchema);

export default ProjectModel;
