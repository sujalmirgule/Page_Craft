import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { requirePortfolioAccess } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import {
  PageCreateValidator,
  PageUpdateValidator,
  PageReorderValidator,
  NavigationLinkValidator,
  NavigationUpdateValidator,
  NavigationReorderValidator,
  isReservedSlug,
} from '@pagecraft/validation';

export function registerPageAndNavigationRoutes(router: Router): void {
  // ====================================================
  // PAGE CRUD ENDPOINTS
  // ====================================================

  // ----------------------------------------------------
  // GET /api/v1/portfolios/:portfolioId/pages — List pages
  // ----------------------------------------------------
  router.get(
    '/:portfolioId/pages',
    requirePortfolioAccess('portfolio:read'),
    (req: Request, res: Response): void => {
      res.status(200).json({
        success: true,
        data: req.portfolio!.pages,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    }
  );

  // ----------------------------------------------------
  // POST /api/v1/portfolios/:portfolioId/pages — Create page
  // ----------------------------------------------------
  router.post(
    '/:portfolioId/pages',
    requirePortfolioAccess('portfolio:update'),
    validateBody(PageCreateValidator),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        const { title, slug, isHomePage, isVisible, seoDescription } = req.body;

        const rawSlug = slug !== undefined && slug !== '' ? slug : title;
        const normalizedSlug = rawSlug
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        // 1. Home Page constraints
        if (isHomePage) {
          const existingHome = portfolio.pages.find((p) => p.isHomePage);
          if (existingHome) {
            res.status(400).json({
              success: false,
              error: {
                code: 'HOME_PAGE_EXISTS',
                message: 'Portfolio already has an active Home page. Only one Home page is permitted.',
              },
            });
            return;
          }
        } else if (!normalizedSlug) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SLUG',
              message: 'Non-home pages must have a non-empty slug',
            },
          });
          return;
        }

        // 2. Reserved slug check
        const finalSlug = isHomePage ? '' : normalizedSlug;
        if (finalSlug && isReservedSlug(finalSlug)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'RESERVED_SLUG',
              message: `Slug '${finalSlug}' is a reserved system path and cannot be used for a page`,
            },
          });
          return;
        }

        // 3. Duplicate slug check within this portfolio
        const duplicateSlug = portfolio.pages.some((p) => p.slug === finalSlug);
        if (duplicateSlug) {
          res.status(409).json({
            success: false,
            error: {
              code: 'DUPLICATE_PAGE_SLUG',
              message: `A page with slug '${finalSlug}' already exists in this portfolio`,
            },
          });
          return;
        }

        // 4. Construct unique page ID and payload
        const pageId = `page-${crypto.randomUUID()}`;
        const newPage = {
          id: pageId,
          slug: finalSlug,
          title: title.trim(),
          isHomePage: Boolean(isHomePage),
          isVisible: isVisible ?? true,
          seoDescription: seoDescription ? seoDescription.trim() : '',
          blocks: [],
        };

        portfolio.pages.push(newPage);
        portfolio.markModified('pages');
        await portfolio.save();

        res.status(201).json({
          success: true,
          data: newPage,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CREATE_PAGE_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // GET /api/v1/portfolios/:portfolioId/pages/:pageId — Get page
  // ----------------------------------------------------
  router.get(
    '/:portfolioId/pages/:pageId',
    requirePortfolioAccess('portfolio:read'),
    (req: Request, res: Response): void => {
      const page = req.portfolio!.pages.find((p) => p.id === req.params.pageId);
      if (!page) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PAGE_NOT_FOUND',
            message: `Page '${req.params.pageId}' not found in this portfolio`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: page,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    }
  );

  // ----------------------------------------------------
  // PATCH /api/v1/portfolios/:portfolioId/pages/:pageId — Update page
  // ----------------------------------------------------
  router.patch(
    '/:portfolioId/pages/:pageId',
    requirePortfolioAccess('portfolio:update'),
    validateBody(PageUpdateValidator),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        const page = portfolio.pages.find((p) => p.id === req.params.pageId);
        if (!page) {
          res.status(404).json({
            success: false,
            error: {
              code: 'PAGE_NOT_FOUND',
              message: `Page '${req.params.pageId}' not found in this portfolio`,
            },
          });
          return;
        }

        const { title, slug, isHomePage, isVisible, seoDescription } = req.body;

        // 1. Title update
        if (title !== undefined) {
          page.title = title.trim();
        }

        // 2. Slug update
        if (slug !== undefined) {
          const normalizedSlug = slug.toLowerCase().trim();
          if (page.isHomePage && normalizedSlug !== '') {
            res.status(400).json({
              success: false,
              error: {
                code: 'CANNOT_MODIFY_HOME_SLUG',
                message: 'The Home page slug must remain the empty root path',
              },
            });
            return;
          }

          if (!page.isHomePage && normalizedSlug === '') {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_SLUG',
                message: 'Non-home pages must have a non-empty slug',
              },
            });
            return;
          }

          if (normalizedSlug && isReservedSlug(normalizedSlug)) {
            res.status(400).json({
              success: false,
              error: {
                code: 'RESERVED_SLUG',
                message: `Slug '${normalizedSlug}' is a reserved system path and cannot be used for a page`,
              },
            });
            return;
          }

          const duplicateSlug = portfolio.pages.some(
            (p) => p.id !== req.params.pageId && p.slug === normalizedSlug
          );
          if (duplicateSlug) {
            res.status(409).json({
              success: false,
              error: {
                code: 'DUPLICATE_PAGE_SLUG',
                message: `A page with slug '${normalizedSlug}' already exists in this portfolio`,
              },
            });
            return;
          }

          page.slug = normalizedSlug;
        }

        // 3. Home page designation
        if (isHomePage !== undefined) {
          if (!isHomePage && page.isHomePage) {
            res.status(400).json({
              success: false,
              error: {
                code: 'CANNOT_UNSET_HOME_PAGE',
                message: 'Cannot unset Home page without designating another page as Home',
              },
            });
            return;
          }

          if (isHomePage && !page.isHomePage) {
            portfolio.pages.forEach((p) => {
              if (p.id !== page.id) p.isHomePage = false;
            });
            page.isHomePage = true;
            page.slug = '';
          }
        }

        // 4. Visibility & SEO updates
        if (isVisible !== undefined) {
          page.isVisible = Boolean(isVisible);
        }

        if (seoDescription !== undefined) {
          page.seoDescription = seoDescription.trim();
        }

        portfolio.markModified('pages');
        await portfolio.save();

        res.status(200).json({
          success: true,
          data: page,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_PAGE_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // DELETE /api/v1/portfolios/:portfolioId/pages/:pageId — Delete page
  // ----------------------------------------------------
  router.delete(
    '/:portfolioId/pages/:pageId',
    requirePortfolioAccess('portfolio:update'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        const page = portfolio.pages.find((p) => p.id === req.params.pageId);
        if (!page) {
          res.status(404).json({
            success: false,
            error: {
              code: 'PAGE_NOT_FOUND',
              message: `Page '${req.params.pageId}' not found in this portfolio`,
            },
          });
          return;
        }

        if (page.isHomePage) {
          res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_DELETE_HOME_PAGE',
              message: 'The Home page cannot be deleted. Every portfolio must maintain a designated Home page.',
            },
          });
          return;
        }

        if (portfolio.pages.length <= 1) {
          res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_DELETE_LAST_PAGE',
              message: 'Cannot delete the only page in the portfolio.',
            },
          });
          return;
        }

        // Remove page subdocument
        portfolio.pages = portfolio.pages.filter((p) => p.id !== req.params.pageId);

        // Referential cleanup in navigation links
        portfolio.navigation.links = portfolio.navigation.links.filter(
          (l) => l.pageId !== req.params.pageId
        );

        portfolio.markModified('pages');
        portfolio.markModified('navigation');
        await portfolio.save();

        res.status(200).json({
          success: true,
          data: {
            id: req.params.pageId,
            message: 'Page deleted successfully',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_PAGE_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // POST & PUT /api/v1/portfolios/:portfolioId/pages/reorder — Reorder pages
  // ----------------------------------------------------
  const handlePageReorder = async (req: Request, res: Response): Promise<void> => {
    try {
      const portfolio = req.portfolio!;
      const { pageIds } = req.body;

      if (pageIds.length !== portfolio.pages.length) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ORDER_PAYLOAD',
            message: 'Page IDs count must match existing portfolio pages count',
          },
        });
        return;
      }

      const existingIds = new Set(portfolio.pages.map((p) => p.id));
      if (new Set(pageIds).size !== pageIds.length) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_PAGE_IDS',
            message: 'Duplicate page IDs in reorder payload',
          },
        });
        return;
      }

      if (!pageIds.every((id: string) => existingIds.has(id))) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PAGE_IDS',
            message: 'Reorder payload contains foreign or non-existent page IDs',
          },
        });
        return;
      }

      const pageMap = new Map(portfolio.pages.map((p) => [p.id, p]));
      portfolio.pages = pageIds.map((id: string) => pageMap.get(id)!);

      portfolio.markModified('pages');
      await portfolio.save();

      res.status(200).json({
        success: true,
        data: portfolio.pages,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'REORDER_PAGES_ERROR',
          message: err.message,
        },
      });
    }
  };

  router.post(
    '/:portfolioId/pages/reorder',
    requirePortfolioAccess('portfolio:update'),
    validateBody(PageReorderValidator),
    handlePageReorder
  );

  router.put(
    '/:portfolioId/pages/reorder',
    requirePortfolioAccess('portfolio:update'),
    validateBody(PageReorderValidator),
    handlePageReorder
  );

  // ====================================================
  // NAVIGATION CONFIG & LINKS ENDPOINTS
  // ====================================================

  // ----------------------------------------------------
  // GET /api/v1/portfolios/:portfolioId/navigation — Get navigation
  // ----------------------------------------------------
  router.get(
    '/:portfolioId/navigation',
    requirePortfolioAccess('portfolio:read'),
    (req: Request, res: Response): void => {
      res.status(200).json({
        success: true,
        data: req.portfolio!.navigation,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    }
  );

  // ----------------------------------------------------
  // PUT & PATCH /api/v1/portfolios/:portfolioId/navigation — Update navigation
  // ----------------------------------------------------
  const handleNavigationUpdate = async (req: Request, res: Response): Promise<void> => {
    try {
      const portfolio = req.portfolio!;
      const { showNavbar, sticky, links } = req.body;

      if (showNavbar !== undefined) {
        portfolio.navigation.showNavbar = Boolean(showNavbar);
      }

      if (sticky !== undefined) {
        portfolio.navigation.sticky = Boolean(sticky);
      }

      if (links !== undefined) {
        const validPageIds = new Set(portfolio.pages.map((p) => p.id));
        for (const link of links) {
          if (!validPageIds.has(link.pageId)) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_PAGE_REFERENCE',
                message: `Referenced pageId '${link.pageId}' does not belong to this portfolio`,
              },
            });
            return;
          }
        }
        portfolio.navigation.links = links.map((l: { label: string; pageId: string }) => ({
          label: l.label.trim(),
          pageId: l.pageId,
        }));
      }

      portfolio.markModified('navigation');
      await portfolio.save();

      res.status(200).json({
        success: true,
        data: portfolio.navigation,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_NAVIGATION_ERROR',
          message: err.message,
        },
      });
    }
  };

  router.put(
    '/:portfolioId/navigation',
    requirePortfolioAccess('portfolio:update'),
    validateBody(NavigationUpdateValidator),
    handleNavigationUpdate
  );

  router.patch(
    '/:portfolioId/navigation',
    requirePortfolioAccess('portfolio:update'),
    validateBody(NavigationUpdateValidator),
    handleNavigationUpdate
  );

  // ----------------------------------------------------
  // POST /api/v1/portfolios/:portfolioId/navigation/links — Add navigation link
  // ----------------------------------------------------
  router.post(
    '/:portfolioId/navigation/links',
    requirePortfolioAccess('portfolio:update'),
    validateBody(NavigationLinkValidator),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        const { label, pageId } = req.body;

        const validPageIds = new Set(portfolio.pages.map((p) => p.id));
        if (!validPageIds.has(pageId)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PAGE_REFERENCE',
              message: `Referenced pageId '${pageId}' does not belong to this portfolio`,
            },
          });
          return;
        }

        portfolio.navigation.links.push({
          label: label.trim(),
          pageId,
        });

        portfolio.markModified('navigation');
        await portfolio.save();

        res.status(201).json({
          success: true,
          data: portfolio.navigation,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'ADD_NAVIGATION_LINK_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // PATCH /api/v1/portfolios/:portfolioId/navigation/links/:target — Update link
  // ----------------------------------------------------
  router.patch(
    '/:portfolioId/navigation/links/:target',
    requirePortfolioAccess('portfolio:update'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        const target = req.params.target;

        let linkIndex = portfolio.navigation.links.findIndex((l) => l.pageId === target);
        if (linkIndex === -1 && !isNaN(Number(target))) {
          const idx = Number(target);
          if (idx >= 0 && idx < portfolio.navigation.links.length) {
            linkIndex = idx;
          }
        }

        if (linkIndex === -1) {
          res.status(404).json({
            success: false,
            error: {
              code: 'LINK_NOT_FOUND',
              message: `Navigation link '${target}' not found`,
            },
          });
          return;
        }

        const { label, pageId } = req.body;

        if (pageId !== undefined) {
          const validPageIds = new Set(portfolio.pages.map((p) => p.id));
          if (!validPageIds.has(pageId)) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_PAGE_REFERENCE',
                message: `Referenced pageId '${pageId}' does not belong to this portfolio`,
              },
            });
            return;
          }
          portfolio.navigation.links[linkIndex].pageId = pageId;
        }

        if (label !== undefined && typeof label === 'string') {
          if (!label.trim()) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_LABEL',
                message: 'Navigation label cannot be empty',
              },
            });
            return;
          }
          portfolio.navigation.links[linkIndex].label = label.trim();
        }

        portfolio.markModified('navigation');
        await portfolio.save();

        res.status(200).json({
          success: true,
          data: portfolio.navigation,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_NAVIGATION_LINK_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // DELETE /api/v1/portfolios/:portfolioId/navigation/links/:target — Delete link
  // ----------------------------------------------------
  router.delete(
    '/:portfolioId/navigation/links/:target',
    requirePortfolioAccess('portfolio:update'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        const target = req.params.target;
        const initialLen = portfolio.navigation.links.length;

        let targetIndex = -1;
        const parsedIdx = Number(target);
        if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < initialLen) {
          targetIndex = parsedIdx;
        }

        portfolio.navigation.links = portfolio.navigation.links.filter((l, idx) => {
          if (l.pageId === target) return false;
          if (idx === targetIndex) return false;
          return true;
        });

        if (portfolio.navigation.links.length === initialLen) {
          res.status(404).json({
            success: false,
            error: {
              code: 'LINK_NOT_FOUND',
              message: `Navigation link '${target}' not found`,
            },
          });
          return;
        }

        portfolio.markModified('navigation');
        await portfolio.save();

        res.status(200).json({
          success: true,
          data: portfolio.navigation,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_NAVIGATION_LINK_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // PUT & POST /api/v1/portfolios/:portfolioId/navigation/reorder — Reorder links
  // ----------------------------------------------------
  const handleNavigationReorder = async (req: Request, res: Response): Promise<void> => {
    try {
      const portfolio = req.portfolio!;
      const { links, pageIds } = req.body;

      const validPageIds = new Set(portfolio.pages.map((p) => p.id));

      if (links && Array.isArray(links)) {
        for (const l of links) {
          if (!validPageIds.has(l.pageId)) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_PAGE_REFERENCE',
                message: `Referenced pageId '${l.pageId}' does not belong to this portfolio`,
              },
            });
            return;
          }
        }
        portfolio.navigation.links = links.map((l: { label: string; pageId: string }) => ({
          label: l.label.trim(),
          pageId: l.pageId,
        }));
      } else if (pageIds && Array.isArray(pageIds)) {
        for (const id of pageIds) {
          if (!validPageIds.has(id)) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_PAGE_REFERENCE',
                message: `Referenced pageId '${id}' does not belong to this portfolio`,
              },
            });
            return;
          }
        }
        const linkMap = new Map(portfolio.navigation.links.map((l) => [l.pageId, l]));
        portfolio.navigation.links = pageIds
          .map((id: string) => linkMap.get(id))
          .filter(Boolean) as Array<{ label: string; pageId: string }>;
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ORDER_PAYLOAD',
            message: 'Must provide either links array or pageIds array for reordering',
          },
        });
        return;
      }

      portfolio.markModified('navigation');
      await portfolio.save();

      res.status(200).json({
        success: true,
        data: portfolio.navigation,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'REORDER_NAVIGATION_ERROR',
          message: err.message,
        },
      });
    }
  };

  router.put(
    '/:portfolioId/navigation/reorder',
    requirePortfolioAccess('portfolio:update'),
    validateBody(NavigationReorderValidator),
    handleNavigationReorder
  );

  router.post(
    '/:portfolioId/navigation/reorder',
    requirePortfolioAccess('portfolio:update'),
    validateBody(NavigationReorderValidator),
    handleNavigationReorder
  );
}
