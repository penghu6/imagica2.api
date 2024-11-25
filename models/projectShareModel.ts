import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectShare extends Document {
  projectId: mongoose.Types.ObjectId;
  createdAt: Date;
  isActive: boolean;
}

const projectShareSchema = new Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model<IProjectShare>('ProjectShare', projectShareSchema); 