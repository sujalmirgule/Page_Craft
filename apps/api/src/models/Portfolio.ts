import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type {
  PortfolioDocument,
  PageSchema,
  BlockSchema,
  ThemeConfig,
  SeoConfig,
  SettingsConfig,
  NavigationConfig,
  CustomDomainConfig,
} from '@pagecraft/types';
import { BlockSchemaValidator } from '@pagecraft/validation';

export interface IPortfolioDocument extends Document {
  schemaVersion: number;
  ownerId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  slug: string;
  title: string;
  isPublished: boolean;
  publishedAt?: Date;
  customDomain?: CustomDomainConfig;
  settings: SettingsConfig;
  seo: SeoConfig;
  theme: ThemeConfig;
  navigation: NavigationConfig;
  pages: PageSchema[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPortfolioModel extends Model<IPortfolioDocument> {
  findBySlug(slug: string): Promise<IPortfolioDocument | null>;
  findPublishedBySlug(slug: string): Promise<IPortfolioDocument | null>;
  findByCustomDomain(domain: string): Promise<IPortfolioDocument | null>;
  findByWorkspace(workspaceId: Types.ObjectId | string): Promise<IPortfolioDocument[]>;
}

// ----------------------------------------------------
// Subdocument: Content Block
// ----------------------------------------------------
const BlockSubSchema = new Schema(
  {
    id: {
      type: String,
      required: [true, 'Block id is required'],
    },
    type: {
      type: String,
      enum: ['header', 'about', 'projects', 'skills', 'experience', 'contact'],
      required: [true, 'Block type is required'],
    },
    order: {
      type: Number,
      required: [true, 'Block order is required'],
      min: 0,
    },
    padding: {
      top: { type: Number, default: 40, min: 0, max: 200 },
      bottom: { type: Number, default: 40, min: 0, max: 200 },
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    content: {
      type: Schema.Types.Mixed,
      required: [true, 'Block content payload is required'],
      validate: {
        validator: function (this: any, val: any) {
          const blockObj = {
            id: this.id || 'block-id',
            type: this.type,
            order: typeof this.order === 'number' ? this.order : 0,
            padding: this.padding || { top: 40, bottom: 40 },
            hidden: Boolean(this.hidden),
            content: val,
          };
          const result = BlockSchemaValidator.safeParse(blockObj);
          return result.success;
        },
        message: (props: any) => `Invalid polymorphic block content payload`,
      },
    },
  },
  { _id: false }
);

// ----------------------------------------------------
// Subdocument: Page Schema
// ----------------------------------------------------
const PageSubSchema = new Schema(
  {
    id: {
      type: String,
      required: [true, 'Page id is required'],
    },
    slug: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
      maxlength: [100, 'Page title cannot exceed 100 characters'],
    },
    isHomePage: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    seoDescription: {
      type: String,
      maxlength: [300, 'Page SEO description cannot exceed 300 characters'],
    },
    blocks: {
      type: [BlockSubSchema],
      default: [],
    },
  },
  { _id: false }
);

// ----------------------------------------------------
// Master Schema: Portfolio Document
// ----------------------------------------------------
const PortfolioSchema = new Schema<IPortfolioDocument, IPortfolioModel>(
  {
    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Portfolio ownerId is required'],
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Portfolio workspaceId is required'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Portfolio slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Portfolio title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    customDomain: {
      domain: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true,
        unique: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      sslActive: {
        type: Boolean,
        default: false,
      },
    },
    settings: {
      faviconUrl: { type: String, trim: true },
      googleAnalyticsId: { type: String, trim: true },
      allowSearchIndexing: { type: Boolean, default: true },
    },
    seo: {
      metaTitle: { type: String, default: '', maxlength: 120 },
      metaDescription: { type: String, default: '', maxlength: 300 },
      ogImageUrl: { type: String, trim: true },
    },
    theme: {
      fontFamily: { type: String, default: 'Inter' },
      colorPalette: {
        primary: { type: String, default: '#0ea5e9' },
        secondary: { type: String, default: '#64748b' },
        background: { type: String, default: '#090d16' },
        surface: { type: String, default: '#0f172a' },
        text: { type: String, default: '#f8fafc' },
      },
      borderRadius: {
        type: String,
        enum: ['none', 'sm', 'md', 'lg', 'full'],
        default: 'md',
      },
      darkMode: { type: Boolean, default: true },
    },
    navigation: {
      showNavbar: { type: Boolean, default: true },
      sticky: { type: Boolean, default: true },
      links: [
        {
          label: { type: String, required: true },
          pageId: { type: String, required: true },
        },
      ],
    },
    pages: {
      type: [PageSubSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'portfolios',
  }
);

// ----------------------------------------------------
// Indexes
// ----------------------------------------------------
PortfolioSchema.index({ ownerId: 1 });
PortfolioSchema.index({ workspaceId: 1 });
PortfolioSchema.index({ 'customDomain.domain': 1 }, { unique: true, sparse: true });
PortfolioSchema.index({ isPublished: 1, slug: 1 }); // Fast published site lookup

// ----------------------------------------------------
// Statics
// ----------------------------------------------------
PortfolioSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug: slug.toLowerCase().trim() });
};

PortfolioSchema.statics.findPublishedBySlug = function (slug: string) {
  return this.findOne({ slug: slug.toLowerCase().trim(), isPublished: true });
};

PortfolioSchema.statics.findByCustomDomain = function (domain: string) {
  return this.findOne({ 'customDomain.domain': domain.toLowerCase().trim(), 'customDomain.verified': true });
};

PortfolioSchema.statics.findByWorkspace = function (workspaceId: Types.ObjectId | string) {
  const id = typeof workspaceId === 'string' ? new Types.ObjectId(workspaceId) : workspaceId;
  return this.find({ workspaceId: id });
};

export const Portfolio: IPortfolioModel =
  (mongoose.models.Portfolio as IPortfolioModel) ||
  mongoose.model<IPortfolioDocument, IPortfolioModel>('Portfolio', PortfolioSchema);
