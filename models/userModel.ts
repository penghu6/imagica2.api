import mongoose, { Schema, Document, CallbackError } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IQuota {
  builds: number;
  storage: number;
  domains: number;
}

interface IQuotaUsage {
  builds: number;
  storage: number;
  domains: number;
}

interface IProfile {
  firstName: string;
  lastName: string;
  company: string;
  website: string;
  location: string;
  bio: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  quota: IQuota;
  quotaUsage: IQuotaUsage;
  avatar?: string;
  profile: IProfile;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [30, '用户名最多30个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  quota: {
    builds: { type: Number, default: 10 },
    storage: { type: Number, default: 1024 },
    domains: { type: Number, default: 1 }
  },
  quotaUsage: {
    builds: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    domains: { type: Number, default: 0 }
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  profile: {
    firstName: String,
    lastName: String,
    company: String,
    website: String,
    location: String,
    bio: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('projectCount', {
  ref: 'ProjectModel',
  localField: '_id',
  foreignField: 'owner',
  count: true
});

const UserModel = mongoose.model<IUser>('UserModel', userSchema, 'users');

export default UserModel;

