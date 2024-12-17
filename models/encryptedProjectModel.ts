import mongoose, { Schema, Document } from 'mongoose';

export interface IEncryptedProject extends Document {
  projectId: mongoose.Types.ObjectId;
  projectEncrypted: string;
  structuresEncrypted: string;
  createdAt: Date;
}

const encryptedProjectSchema: Schema = new Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  projectEncrypted: {
    type: String,
    required: true
  },
  structuresEncrypted: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const EncryptedProjectModel = mongoose.model<IEncryptedProject>('EncryptedProject', encryptedProjectSchema);

export default EncryptedProjectModel; 