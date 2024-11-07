const mongoose = require('mongoose');
const path = require('path');

/**
 * 项目模型
 * @description 存储项目信息、构建配置和部署设置
 */
const projectSchema = new mongoose.Schema({
  // 项目名称
  name: {
    type: String,
    required: [true, '项目名称不能为空'],
    trim: true,
    maxlength: [100, '项目名称不能超过100个字符']
  },
  // 项目描述
  description: {
    type: String,
    trim: true,
    maxlength: [500, '项目描述不能超过500个字符']
  },
  // 项目所有者
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true
  },
  // 协作者
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel'
    },
    role: {
      type: String,
      enum: ['reader', 'developer', 'maintainer'],
      default: 'reader'
    }
  }],
  // 项目类型
  type: {
    type: String,
    enum: {
      values: ['react', 'vue', 'html', 'nextjs'],
      message: '不支持的项目类型'
    },
    required: true
  },
  // 源代码信息
  sourceCode: {
    bucket: String,     // 存储桶名称
    key: String,        // 对象键名
    version: String,    // 版本号
    size: Number,       // 文件大小
    mimeType: String,   // 文件类型
    etag: String,       // 对象 ETag
    lastUpdated: Date   // 最后更新时间
  },
  // 构建配置
  buildConfig: {
    framework: String,
    nodeVersion: {
      type: String,
      default: '16.x'
    },
    buildCommand: String,
    outputDir: String,
    environmentVariables: {
      type: Map,
      of: String
    }
  },
  // 部署配置
  deploymentConfig: {
    domain: String,
    customDomain: String,
    sslEnabled: {
      type: Boolean,
      default: false
    },
    containerConfig: {
      memory: {
        type: String,
        default: '512m'
      },
      cpu: {
        type: String,
        default: '0.5'
      },
      port: {
        type: Number,
        default: 3000
      }
    }
  },
  // 项目状态
  status: {
    type: String,
    enum: {
      values: ['active', 'archived', 'deleted'],
      message: '无效的项目状态'
    },
    default: 'active'
  },
  stats: {
    builds: { type: Number, default: 0 },      // 构建次数
    deployments: { type: Number, default: 0 },  // 部署次数
    lastBuildAt: Date,                         // 最后构建时间
    lastDeployAt: Date                         // 最后部署时间
  },
  settings: {
    autoDeploy: { type: Boolean, default: true },  // 自动部署
    buildNotification: { type: Boolean, default: true }, // 构建通知
    maintenance: { type: Boolean, default: false }  // 维护模式
  },
  showCodeEditor: {
    type: Boolean,
    default: false, // 是否显示代码编辑器
  },
  showUploadModal: {
    type: Boolean,
    default: false, // 是否显示上传模态框
  },
  uploadUrl: {
    type: String,
    default: '', // 上传的URL
  },
  isPublishing: {
    type: Boolean,
    default: false, // 是否正在发布
  },
  isAITyping: {
    type: Boolean,
    default: false, // AI是否正在输入
  },
  publishSettings: {
    customDomain: {
      type: String,
      default: '', // 发布设置中的自定义域名
    }
  },
  showPublishSettings: {
    type: Boolean,
    default: false, // 是否显示发布设置
  },
  // 新增字段：项目开发目录路径
  developmentDirectory: {
    type: String,
    required: true,
    default: function() {
      return path.join('users', this.owner.toString(), 'projects', this._id.toString(), 'development');
    }
  },
  // 项目标签
  tags: [{
    type: String,
    trim: true
  }],
  // 项目优先级
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  code: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
projectSchema.index({ owner: 1, name: 1 }, { unique: true });
projectSchema.index({ customDomain: 1 }, { sparse: true });

// 虚拟字段：最新构建
projectSchema.virtual('latestBuild', {
  ref: 'BuildModel',
  localField: '_id',
  foreignField: 'project',
  justOne: true,
  options: { sort: { createdAt: -1 } }
});

// 直接导出模型
const ProjectModel = mongoose.model('ProjectModel', projectSchema, 'projects');
module.exports = ProjectModel;
