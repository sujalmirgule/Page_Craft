import mongoose, { Schema, Document, Model } from 'mongoose';
import type { PlanTier, UserRole } from '@pagecraft/types';

export interface IUserDocument extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  plan: PlanTier;
  role: UserRole;
  tokenVersion: number;
  oauthProviders: {
    googleId?: string;
    githubId?: string;
  };
  razorpayCustomerId?: string;
  subscriptionExpiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      select: false, // Prevents leaking password hash in standard queries
      minlength: [8, 'Password hash must be at least 8 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free',
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'super_admin', 'admin'],
      default: 'user',
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    oauthProviders: {
      googleId: {
        type: String,
        sparse: true,
        index: true,
      },
      githubId: {
        type: String,
        sparse: true,
        index: true,
      },
    },
    razorpayCustomerId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Statics
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Safe JSON serialization
UserSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    delete ret.passwordHash;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

export const User: IUserModel =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUserDocument, IUserModel>('User', UserSchema);
