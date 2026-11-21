import { z } from 'zod';

export const BlockTypeSchema = z.enum([
  'header',
  'about',
  'projects',
  'skills',
  'experience',
  'contact'
]);

export const BaseBlockSchema = z.object({
  id: z.string().min(1),
  type: BlockTypeSchema,
  order: z.number().int().min(0),
  padding: z.object({
    top: z.number().min(0).max(200),
    bottom: z.number().min(0).max(200),
  }),
  hidden: z.boolean().default(false),
});

export const HeaderBlockSchema = BaseBlockSchema.extend({
  type: z.literal('header'),
  content: z.object({
    avatarUrl: z.string().url().optional().or(z.literal('')),
    fullName: z.string().min(1, 'Full name is required').max(100),
    headline: z.string().max(200),
    bioShort: z.string().max(500),
    socialLinks: z.array(z.object({
      platform: z.string().min(1),
      url: z.string().url(),
    })),
    ctaButton: z.object({
      label: z.string().min(1),
      url: z.string().min(1),
    }).optional(),
  }),
});

export const AboutBlockSchema = BaseBlockSchema.extend({
  type: z.literal('about'),
  content: z.object({
    title: z.string().min(1).max(100),
    bioParagraphs: z.array(z.string().max(2000)),
    highlights: z.array(z.string().max(100)),
  }),
});

export const ProjectItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(150),
  description: z.string().max(1000),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().max(40)),
  demoUrl: z.string().url().optional().or(z.literal('')),
  repoUrl: z.string().url().optional().or(z.literal('')),
});

export const ProjectsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('projects'),
  content: z.object({
    title: z.string().min(1).max(100),
    layout: z.enum(['grid', 'cards', 'compact']).default('grid'),
    projectsList: z.array(ProjectItemSchema),
  }),
});

export const SkillsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('skills'),
  content: z.object({
    title: z.string().min(1).max(100),
    categories: z.array(z.object({
      categoryName: z.string().min(1).max(60),
      skillsList: z.array(z.string().min(1).max(50)),
    })),
  }),
});

export const ExperienceBlockSchema = BaseBlockSchema.extend({
  type: z.literal('experience'),
  content: z.object({
    title: z.string().min(1).max(100),
    timeline: z.array(z.object({
      role: z.string().min(1).max(100),
      company: z.string().min(1).max(100),
      location: z.string().max(100).optional(),
      startDate: z.string().min(1),
      endDate: z.string().min(1),
      isCurrent: z.boolean(),
      achievements: z.array(z.string().max(500)),
    })),
  }),
});

export const ContactBlockSchema = BaseBlockSchema.extend({
  type: z.literal('contact'),
  content: z.object({
    title: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    location: z.string().max(100).optional(),
    showContactForm: z.boolean().default(true),
  }),
});

export const BlockSchemaValidator = z.discriminatedUnion('type', [
  HeaderBlockSchema,
  AboutBlockSchema,
  ProjectsBlockSchema,
  SkillsBlockSchema,
  ExperienceBlockSchema,
  ContactBlockSchema,
]);

export const PageSchemaValidator = z.object({
  id: z.string().min(1),
  slug: z.string().max(80),
  title: z.string().min(1).max(100),
  isHomePage: z.boolean(),
  isVisible: z.boolean().default(true),
  seoDescription: z.string().max(300).optional(),
  blocks: z.array(BlockSchemaValidator),
});

export const PortfolioDocumentValidator = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int().min(1),
  ownerId: z.string().min(1),
  workspaceId: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  title: z.string().min(1).max(120),
  isPublished: z.boolean(),
  publishedAt: z.string().datetime().optional(),
  settings: z.object({
    faviconUrl: z.string().url().optional(),
    googleAnalyticsId: z.string().max(40).optional(),
    allowSearchIndexing: z.boolean().default(true),
  }),
  seo: z.object({
    metaTitle: z.string().max(120),
    metaDescription: z.string().max(300),
    ogImageUrl: z.string().url().optional(),
  }),
  theme: z.object({
    fontFamily: z.string(),
    colorPalette: z.object({
      primary: z.string(),
      secondary: z.string(),
      background: z.string(),
      surface: z.string(),
      text: z.string(),
    }),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
    darkMode: z.boolean(),
  }),
  navigation: z.object({
    showNavbar: z.boolean(),
    sticky: z.boolean(),
    links: z.array(z.object({
      label: z.string(),
      pageId: z.string(),
    })),
  }),
  pages: z.array(PageSchemaValidator),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Auth Validators
export const UserRegisterValidator = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password cannot exceed 128 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
});

export const UserLoginValidator = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(128, 'Password cannot exceed 128 characters'),
});

export const SlugReservationValidator = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});
