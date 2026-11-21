import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ShowcaseCategory, PortfolioDocument } from '@pagecraft/types';

export interface IShowcaseTemplateDocument extends Document {
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  authorId: Types.ObjectId;
  authorName: string;
  category: ShowcaseCategory;
  tags: string[];
  portfolioSnapshot: PortfolioDocument;
  isFeatured: boolean;
  cloneCount: number;
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShowcaseTemplateModel extends Model<IShowcaseTemplateDocument> {
  findBySlug(slug: string): Promise<IShowcaseTemplateDocument | null>;
  findFeatured(): Promise<IShowcaseTemplateDocument[]>;
  findByCategory(category: ShowcaseCategory): Promise<IShowcaseTemplateDocument[]>;
}

const ShowcaseTemplateSchema = new Schema<IShowcaseTemplateDocument, IShowcaseTemplateModel>(
  {
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Template slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Template description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Template authorId is required'],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['software-engineer', 'designer', 'product-manager', 'student', 'other'],
      required: [true, 'Template category is required'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    portfolioSnapshot: {
      type: Schema.Types.Mixed,
      required: [true, 'Template portfolio snapshot payload is required'],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    cloneCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'showcase_templates',
  }
);

// Indexes
ShowcaseTemplateSchema.index({ category: 1 });
ShowcaseTemplateSchema.index({ isFeatured: 1 });
ShowcaseTemplateSchema.index({ tags: 1 });
ShowcaseTemplateSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 5, tags: 3, description: 1 } }
);

// Statics
ShowcaseTemplateSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug: slug.toLowerCase().trim() });
};

ShowcaseTemplateSchema.statics.findFeatured = function () {
  return this.find({ isFeatured: true }).sort({ upvotes: -1, cloneCount: -1 });
};

ShowcaseTemplateSchema.statics.findByCategory = function (category: ShowcaseCategory) {
  return this.find({ category }).sort({ upvotes: -1 });
};

export const ShowcaseTemplate: IShowcaseTemplateModel =
  (mongoose.models.ShowcaseTemplate as IShowcaseTemplateModel) ||
  mongoose.model<IShowcaseTemplateDocument, IShowcaseTemplateModel>(
    'ShowcaseTemplate',
    ShowcaseTemplateSchema
  );
