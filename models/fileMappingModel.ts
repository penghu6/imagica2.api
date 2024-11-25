import mongoose, { Schema, Document } from 'mongoose';

/**
 * 文件映射接口定义
 * @interface IFileMapping
 * @extends Document
 */
export interface IFileMapping extends Document {
  /** 项目ID */
  projectId: mongoose.Types.ObjectId;
  
  /** 开发版本号 */
  devVersion: string;
  
  /** 文件唯一标识 */
  fileId: string;
  
  /** 相对项目根目录的路径 */
  relativePath: string;
  
  /** 文件类型 */
  fileType: 'file' | 'folder';
  
  /** 文件内容的哈希值 */
  hash: string;
  
  /** 文件大小（字节） */
  size: number;
  
  /** MIME类型 */
  mimeType?: string;
  
  /** 文件状态 */
  status: 'synced' | 'modified' | 'conflict' | 'deleted';
  
  /** 同步信息 */
  sync: {
    lastSyncTime: Date;
    lastModified: Date;
    version: number;      // 文件版本号，每次修改递增
    clientId?: string;    // 最后修改的客户端ID
  };
  
  /** 文件元数据 */
  metadata?: {
    encoding?: string;
    lineEnding?: 'LF' | 'CRLF';
    readonly?: boolean;
    hidden?: boolean;
  };
}

const fileMappingSchema: Schema = new Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  devVersion: {
    type: String,
    required: true
  },
  fileId: {
    type: String,
    required: true,
    unique: true
  },
  relativePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['file', 'folder'],
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  mimeType: String,
  status: {
    type: String,
    enum: ['synced', 'modified', 'conflict', 'deleted'],
    default: 'synced'
  },
  sync: {
    lastSyncTime: {
      type: Date,
      default: Date.now
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    },
    clientId: String
  },
  metadata: {
    encoding: String,
    lineEnding: {
      type: String,
      enum: ['LF', 'CRLF']
    },
    readonly: Boolean,
    hidden: Boolean
  }
}, {
  timestamps: true
});

// 索引
fileMappingSchema.index({ projectId: 1, devVersion: 1, relativePath: 1 }, { unique: true });
fileMappingSchema.index({ fileId: 1 }, { unique: true });

const FileMappingModel = mongoose.model<IFileMapping>('FileMapping', fileMappingSchema);

export default FileMappingModel; 