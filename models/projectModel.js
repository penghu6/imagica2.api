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
  userId: {
    type: String,
    required: true
  },
  // 项目类型
  type: {
    type: String,
    enum: {
      values: ['react', 'vue', 'html', 'nextjs'],
      message: '不支持的项目类型'
    },
    required: true
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
    // default: function() {
    //   return path.join('users', this.owner.toString(), 'projects', this._id.toString(), 'development');
    // }
  },
  type: {
    type: String,
    default: "single"
  },
  // 项目优先级
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
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
