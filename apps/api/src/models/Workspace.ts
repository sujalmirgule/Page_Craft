import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { WorkspaceRole } from '@pagecraft/types';

export interface IWorkspaceMember {
  userId: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface IWorkspaceDocument extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  members: IWorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
  hasMember(userId: Types.ObjectId | string): boolean;
  getMemberRole(userId: Types.ObjectId | string): WorkspaceRole | null;
}

export interface IWorkspaceModel extends Model<IWorkspaceDocument> {
  findBySlug(slug: string): Promise<IWorkspaceDocument | null>;
  findByUser(userId: Types.ObjectId | string): Promise<IWorkspaceDocument[]>;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member userId is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      required: [true, 'Member role is required'],
      default: 'viewer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const WorkspaceSchema = new Schema<IWorkspaceDocument, IWorkspaceModel>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [2, 'Workspace name must be at least 2 characters'],
      maxlength: [80, 'Workspace name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'],
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workspace ownerId is required'],
      index: true,
    },
    members: {
      type: [WorkspaceMemberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'workspaces',
  }
);

// Compound & Secondary Indexes
WorkspaceSchema.index({ ownerId: 1 });
WorkspaceSchema.index({ 'members.userId': 1 });

// Methods
WorkspaceSchema.methods.hasMember = function (userId: Types.ObjectId | string): boolean {
  const targetId = userId.toString();
  return this.members.some((m: IWorkspaceMember) => m.userId.toString() === targetId);
};

WorkspaceSchema.methods.getMemberRole = function (userId: Types.ObjectId | string): WorkspaceRole | null {
  const targetId = userId.toString();
  const member = this.members.find((m: IWorkspaceMember) => m.userId.toString() === targetId);
  return member ? member.role : null;
};

// Statics
WorkspaceSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug: slug.toLowerCase().trim() });
};

WorkspaceSchema.statics.findByUser = function (userId: Types.ObjectId | string) {
  const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  return this.find({
    $or: [{ ownerId: id }, { 'members.userId': id }],
  });
};

export const Workspace: IWorkspaceModel =
  (mongoose.models.Workspace as IWorkspaceModel) ||
  mongoose.model<IWorkspaceDocument, IWorkspaceModel>('Workspace', WorkspaceSchema);
