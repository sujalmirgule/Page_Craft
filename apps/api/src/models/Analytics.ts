import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReferrerItem {
  source: string;
  count: number;
}

export interface ICountryItem {
  country: string;
  count: number;
}

export interface IDeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface IAnalyticsDocument extends Document {
  portfolioId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  views: number;
  uniqueVisitors: number;
  referrers: IReferrerItem[];
  countries: ICountryItem[];
  devices: IDeviceBreakdown;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalyticsModel extends Model<IAnalyticsDocument> {
  findByPortfolioAndRange(
    portfolioId: Types.ObjectId | string,
    startDate: string,
    endDate: string
  ): Promise<IAnalyticsDocument[]>;
}

const AnalyticsSchema = new Schema<IAnalyticsDocument, IAnalyticsModel>(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: [true, 'Analytics portfolioId is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Analytics date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    referrers: [
      {
        source: { type: String, required: true },
        count: { type: Number, default: 0, min: 0 },
      },
    ],
    countries: [
      {
        country: { type: String, required: true },
        count: { type: Number, default: 0, min: 0 },
      },
    ],
    devices: {
      desktop: { type: Number, default: 0, min: 0 },
      mobile: { type: Number, default: 0, min: 0 },
      tablet: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'analytics',
  }
);

// Compound Unique Index: One document per portfolio per date
AnalyticsSchema.index({ portfolioId: 1, date: -1 }, { unique: true });

// Statics
AnalyticsSchema.statics.findByPortfolioAndRange = function (
  portfolioId: Types.ObjectId | string,
  startDate: string,
  endDate: string
) {
  const id = typeof portfolioId === 'string' ? new Types.ObjectId(portfolioId) : portfolioId;
  return this.find({
    portfolioId: id,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

export const Analytics: IAnalyticsModel =
  (mongoose.models.Analytics as IAnalyticsModel) ||
  mongoose.model<IAnalyticsDocument, IAnalyticsModel>('Analytics', AnalyticsSchema);
