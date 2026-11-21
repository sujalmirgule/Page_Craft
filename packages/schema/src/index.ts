import type {
  PortfolioDocument,
  PageSchema,
  BlockType,
  HeaderBlock,
  AboutBlock,
  ProjectsBlock,
  SkillsBlock,
  ExperienceBlock,
  ContactBlock
} from '@pagecraft/types';

export const CURRENT_SCHEMA_VERSION = 1;

export const SUPPORTED_BLOCK_TYPES: readonly BlockType[] = [
  'header',
  'about',
  'projects',
  'skills',
  'experience',
  'contact'
] as const;

export const DEFAULT_THEME = {
  fontFamily: 'Inter',
  colorPalette: {
    primary: '#0ea5e9',
    secondary: '#64748b',
    background: '#090d16',
    surface: '#0f172a',
    text: '#f8fafc',
  },
  borderRadius: 'md' as const,
  darkMode: true,
};

export function createDefaultHeaderBlock(id: string): HeaderBlock {
  return {
    id,
    type: 'header',
    order: 0,
    padding: { top: 48, bottom: 48 },
    hidden: false,
    content: {
      fullName: 'Alex Morgan',
      headline: 'Full-Stack Software Engineer & System Architect',
      bioShort: 'Building resilient web platforms and real-time distributed applications.',
      socialLinks: [
        { platform: 'GitHub', url: 'https://github.com' },
        { platform: 'LinkedIn', url: 'https://linkedin.com' }
      ]
    }
  };
}

export function createDefaultAboutBlock(id: string): AboutBlock {
  return {
    id,
    type: 'about',
    order: 1,
    padding: { top: 40, bottom: 40 },
    hidden: false,
    content: {
      title: 'About Me',
      bioParagraphs: [
        'I am a passionate software engineer focused on developing accessible, responsive, and performance-oriented products.',
        'Experienced in modern TypeScript ecosystems, cloud architectures, and user-centric design.'
      ],
      highlights: ['5+ Years Experience', 'TypeScript / Node.js', 'Distributed Systems']
    }
  };
}

export function createDefaultProjectsBlock(id: string): ProjectsBlock {
  return {
    id,
    type: 'projects',
    order: 2,
    padding: { top: 40, bottom: 40 },
    hidden: false,
    content: {
      title: 'Featured Projects',
      layout: 'grid',
      projectsList: [
        {
          id: 'proj-1',
          title: 'Distributed Real-Time Engine',
          description: 'A scalable CRDT-based synchronization service with sub-50ms latency.',
          tags: ['Node.js', 'WebSocket', 'Redis', 'TypeScript'],
          repoUrl: 'https://github.com'
        }
      ]
    }
  };
}

export function createDefaultSkillsBlock(id: string): SkillsBlock {
  return {
    id,
    type: 'skills',
    order: 3,
    padding: { top: 40, bottom: 40 },
    hidden: false,
    content: {
      title: 'Technical Skills',
      categories: [
        {
          categoryName: 'Frontend',
          skillsList: ['React', 'TypeScript', 'Tailwind CSS', 'Zustand']
        },
        {
          categoryName: 'Backend & Data',
          skillsList: ['Node.js', 'Express', 'MongoDB Atlas', 'Redis', 'BullMQ']
        }
      ]
    }
  };
}

export function createDefaultExperienceBlock(id: string): ExperienceBlock {
  return {
    id,
    type: 'experience',
    order: 4,
    padding: { top: 40, bottom: 40 },
    hidden: false,
    content: {
      title: 'Work Experience',
      timeline: [
        {
          role: 'Senior Software Engineer',
          company: 'Acme Systems',
          location: 'San Francisco, CA',
          startDate: '2023-01',
          endDate: 'Present',
          isCurrent: true,
          achievements: [
            'Architected high-throughput ingestion microservices handling 20k req/sec.',
            'Mentored junior developers and instituted strict static analysis pipelines.'
          ]
        }
      ]
    }
  };
}

export function createDefaultContactBlock(id: string): ContactBlock {
  return {
    id,
    type: 'contact',
    order: 5,
    padding: { top: 40, bottom: 40 },
    hidden: false,
    content: {
      title: 'Get in Touch',
      email: 'alex.morgan@example.com',
      location: 'San Francisco, CA',
      showContactForm: true
    }
  };
}

export function createStarterPortfolio(ownerId: string, workspaceId: string, slug: string): PortfolioDocument {
  const homePage: PageSchema = {
    id: 'page-home',
    slug: '',
    title: 'Home',
    isHomePage: true,
    isVisible: true,
    blocks: [
      createDefaultHeaderBlock('block-header-1'),
      createDefaultAboutBlock('block-about-1'),
      createDefaultProjectsBlock('block-projects-1'),
      createDefaultSkillsBlock('block-skills-1'),
      createDefaultExperienceBlock('block-experience-1'),
      createDefaultContactBlock('block-contact-1')
    ]
  };

  return {
    id: 'portfolio-init',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ownerId,
    workspaceId,
    slug,
    title: 'My Portfolio',
    isPublished: false,
    settings: {
      allowSearchIndexing: true
    },
    seo: {
      metaTitle: 'Alex Morgan | Portfolio',
      metaDescription: 'Personal portfolio and resume built with Pagecraft.'
    },
    theme: DEFAULT_THEME,
    navigation: {
      showNavbar: true,
      sticky: true,
      links: [{ label: 'Home', pageId: 'page-home' }]
    },
    pages: [homePage],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
