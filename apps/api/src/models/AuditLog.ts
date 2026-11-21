import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { AuditStatus } from '@pagecraft/types';

export interface IAuditLogDocument extends Document {
  userId?: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  action: string;
  targetEntity: string;
  targetId: string;
  ipAddress?: string;
  userAgent?: string;
  diff?: Record<string, any>;
  status: AuditStatus;
  createdAt: Date;
}

export interface IAuditLogModel extends Model<IAuditLogDocument> {
  findByUser(userId: Types.ObjectId | string, limit?: number): Promise<IAuditLogDocument[]>;
  findByWorkspace(workspaceId: Types.ObjectId | string, limit?: number): Promise<IAuditLogDocument[]>;
}

const AuditLogSchema = new Schema<IAuditLogDocument, IAuditLogModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true,
    },
    targetEntity: {
      type: String,
      required: [true, 'Target entity is required'],
    },
    targetId: {
      type: String,
      required: [true, 'Target id is required'],
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    diff: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Prevents tampering
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only log
    collection: 'audit_logs',
  }
);

// Compound Indexes for audit log queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

// Statics
AuditLogSchema.statics.findByUser = function (userId: Types.ObjectId | string, limit = 50) {
  const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  return this.find({ userId: id }).sort({ createdAt: -1 }).limit(limit);
};

AuditLogSchema.statics.findByWorkspace = function (workspaceId: Types.ObjectId | string, limit = 50) {
  const id = typeof workspaceId === 'string' ? new Types.ObjectId(workspaceId) : workspaceId;
  return this.find({ workspaceId: id }).sort({ createdAt: -1 }).limit(limit);
};

export const AuditLog: IAuditLogModel =
  (mongoose.models.AuditLog as IAuditLogModel) ||
  mongoose.model<IAuditLogDocument, IAuditLogModel>('AuditLog', AuditLogSchema);
