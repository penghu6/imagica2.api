import mongoose, { Schema, Document } from 'mongoose';
import path from 'path';

export interface IProject extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  collaborators: Array<{
    user: mongoose.Types.ObjectId;
    role: 'reader' | 'developer' | 'maintainer';
  }>;
  type: 'react' | 'vue' | 'html' | 'nextjs';
  sourceCode: {
    bucket: string;
    key: string;
    version: string;
    size: number;
    mimeType: string;
    etag: string;
    lastUpdated: Date;
  };
  buildConfig: {
    framework?: string;
    nodeVersion: string;
    buildCommand?: string;
    outputDir?: string;
    environmentVariables: Map<string, string>;
  };
  isPublishing: boolean;
  isAITyping: boolean;
  publishSettings: {
    customDomain: string;
  };
  showPublishSettings: boolean;
  developmentDirectory: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
}

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
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true
  },
  collaborators: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'UserModel'
    },
    role: {
      type: String,
      enum: ['reader', 'developer', 'maintainer'],
      default: 'reader'
    }
  }],
  type: {
    type: String,
    enum: ['react', 'vue', 'html', 'nextjs'],
    required: true
  },
  sourceCode: {
    bucket: String,
    key: String,
    version: String,
    size: Number,
    mimeType: String,
    etag: String,
    lastUpdated: Date
  },
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
  isPublishing: {
    type: Boolean,
    default: false
  },
  isAITyping: {
    type: Boolean,
    default: false
  },
  publishSettings: {
    customDomain: {
      type: String,
      default: ''
    }
  },
  showPublishSettings: {
    type: Boolean,
    default: false
  },
  developmentDirectory: {
    type: String,
    required: true,
    default: function(this: IProject) {
      return path.join('users', this.owner.toString(), 'projects', this._id.toString(), 'development');
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
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

projectSchema.index({ owner: 1, name: 1 }, { unique: true });
projectSchema.index({ customDomain: 1 }, { sparse: true });

projectSchema.virtual('latestBuild', {
  ref: 'BuildModel',
  localField: '_id',
  foreignField: 'project',
  justOne: true,
  options: { sort: { createdAt: -1 } }
});

const ProjectModel = mongoose.model<IProject>('ProjectModel', projectSchema);

export default ProjectModel;
