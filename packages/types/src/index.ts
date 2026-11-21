// ==========================================
// PAGECRAFT AUTHORITATIVE TYPE SYSTEM
// ==========================================

export type PlanTier = 'free' | 'pro' | 'business';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export type UserRole = 'user' | 'super_admin' | 'admin';

export interface OAuthProviders {
  googleId?: string;
  githubId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: PlanTier;
  role: UserRole;
  tokenVersion?: number;
  oauthProviders?: OAuthProviders;
  razorpayCustomerId?: string;
  subscriptionExpiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Portfolio Document Structure
// ------------------------------------------

export interface ThemeConfig {
  fontFamily: string;
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  darkMode: boolean;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl?: string;
}

export interface SettingsConfig {
  faviconUrl?: string;
  googleAnalyticsId?: string;
  allowSearchIndexing: boolean;
}

export interface NavigationConfig {
  showNavbar: boolean;
  sticky: boolean;
  links: Array<{ label: string; pageId: string }>;
}

export interface CustomDomainConfig {
  domain: string;
  verified: boolean;
  sslActive: boolean;
}

// ------------------------------------------
// Polymorphic Content Blocks
// ------------------------------------------

export type BlockType = 
  | 'header'
  | 'about'
  | 'projects'
  | 'skills'
  | 'experience'
  | 'contact';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  padding: { top: number; bottom: number };
  hidden: boolean;
}

export interface HeaderBlock extends BaseBlock {
  type: 'header';
  content: {
    avatarUrl?: string;
    fullName: string;
    headline: string;
    bioShort: string;
    socialLinks: Array<{ platform: string; url: string }>;
    ctaButton?: { label: string; url: string };
  };
}

export interface AboutBlock extends BaseBlock {
  type: 'about';
  content: {
    title: string;
    bioParagraphs: string[];
    highlights: string[];
  };
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  tags: string[];
  demoUrl?: string;
  repoUrl?: string;
}

export interface ProjectsBlock extends BaseBlock {
  type: 'projects';
  content: {
    title: string;
    layout: 'grid' | 'cards' | 'compact';
    projectsList: ProjectItem[];
  };
}

export interface SkillCategory {
  categoryName: string;
  skillsList: string[];
}

export interface SkillsBlock extends BaseBlock {
  type: 'skills';
  content: {
    title: string;
    categories: SkillCategory[];
  };
}

export interface ExperienceItem {
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string[];
}

export interface ExperienceBlock extends BaseBlock {
  type: 'experience';
  content: {
    title: string;
    timeline: ExperienceItem[];
  };
}

export interface ContactBlock extends BaseBlock {
  type: 'contact';
  content: {
    title: string;
    email: string;
    phone?: string;
    location?: string;
    showContactForm: boolean;
  };
}

export type BlockSchema = 
  | HeaderBlock 
  | AboutBlock 
  | ProjectsBlock 
  | SkillsBlock 
  | ExperienceBlock 
  | ContactBlock;

export interface PageSchema {
  id: string;
  slug: string;
  title: string;
  isHomePage: boolean;
  isVisible: boolean;
  seoDescription?: string;
  blocks: BlockSchema[];
}

export interface PortfolioDocument {
  id: string;
  schemaVersion: number;
  ownerId: string;
  workspaceId: string;
  slug: string;
  title: string;
  isPublished: boolean;
  publishedAt?: string;
  customDomain?: CustomDomainConfig;
  settings: SettingsConfig;
  seo: SeoConfig;
  theme: ThemeConfig;
  navigation: NavigationConfig;
  pages: PageSchema[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Ecosystem & Telemetry Domain Models
// ------------------------------------------

export type ShowcaseCategory =
  | 'software-engineer'
  | 'designer'
  | 'product-manager'
  | 'student'
  | 'other';

export interface ShowcaseTemplate {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  category: ShowcaseCategory;
  tags: string[];
  portfolioSnapshot: PortfolioDocument;
  isFeatured: boolean;
  cloneCount: number;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}

export type AuditStatus = 'success' | 'failure';

export interface AuditLog {
  id: string;
  userId?: string;
  workspaceId?: string;
  action: string;
  targetEntity: string;
  targetId: string;
  ipAddress?: string;
  userAgent?: string;
  diff?: Record<string, any>;
  status: AuditStatus;
  createdAt: string;
}

export interface AnalyticsRollup {
  id: string;
  portfolioId: string;
  date: string; // YYYY-MM-DD
  views: number;
  uniqueVisitors: number;
  referrers: Array<{ source: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// API Envelope & Standard Responses
// ------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}
