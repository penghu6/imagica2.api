const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * 用户模型
 * @description 存储用户基本信息、认证信息和订阅计划
 */
const userSchema = new mongoose.Schema({
  // 用户名
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [30, '用户名最多30个字符']
  },
  // 电子邮箱
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  // 密码
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // API 返回数据时默认不包含密码
  },
  // 用户角色
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: '无效的用户角色'
    },
    default: 'user'
  },
  // 账户状态
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended'],
      message: '无效的账户状态'
    },
    default: 'active'
  },
  // 订阅计划
  plan: {
    type: String,
    enum: {
      values: ['free', 'pro', 'enterprise'],
      message: '无效的订阅计划'
    },
    default: 'free'
  },
  // 资源使用配额
  quota: {
    builds: { type: Number, default: 10 },    // 每月构建次数
    storage: { type: Number, default: 1024 }, // 存储空间(MB)
    domains: { type: Number, default: 1 }     // 可绑定域名数
  },
  // 头像
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  // 个人信息
  profile: {
    firstName: String,
    lastName: String,
    company: String,
    website: String,
    location: String,
    bio: String
  },
  // 实际使用量统计
  quotaUsage: {
    builds: { type: Number, default: 0 },    // 已使用构建次数
    storage: { type: Number, default: 0 },    // 已使用存储空间
    domains: { type: Number, default: 0 }     // 已使用域名数
  }
}, {
  timestamps: true, // 自动管理 createdAt 和 updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * 密码加密中间件
 * 在保存用户数据前自动对密码进行加密
 */
userSchema.pre('save', async function(next) {
  // 仅在密码被修改时进行加密
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 验证密码
 * @param {string} candidatePassword - 待验证的密码
 * @returns {Promise<boolean>} 返回密码是否匹配
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 虚拟字段：项目数量
userSchema.virtual('projectCount', {
  ref: 'ProjectModel',
  localField: '_id',
  foreignField: 'owner',
  count: true
});


mongoose.model('UserModel', userSchema, 'users');
// 将此模型进行导出
module.exports = mongoose.model('UserModel');