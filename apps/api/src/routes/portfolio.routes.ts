import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Portfolio } from '../models/Portfolio';
import { Workspace } from '../models/Workspace';
import { authenticate } from '../middleware/authenticate';
import { requirePortfolioAccess } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import {
  PortfolioCreateValidator,
  PortfolioUpdateValidator,
  isReservedSlug,
} from '@pagecraft/validation';
import { createStarterPortfolio } from '@pagecraft/schema';
import { can } from '@pagecraft/permissions';
import type { ApiResponse } from '@pagecraft/types';

export function createPortfolioRouter(jwtAccessSecret: string): Router {
  const router = Router();

  // All portfolio operations require an authenticated user
  router.use(authenticate(jwtAccessSecret));

  // ----------------------------------------------------
  // POST /api/v1/portfolios — Create new portfolio
  // ----------------------------------------------------
  router.post(
    '/',
    validateBody(PortfolioCreateValidator),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { workspaceId, title, slug, theme, seo } = req.body;

        // 1. Validate workspaceId ObjectId
        if (!mongoose.isValidObjectId(workspaceId)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ID',
              message: 'Workspace identifier must be a valid MongoDB ObjectId',
            },
          });
          return;
        }

        // 2. Reject reserved slug
        const normalizedSlug = slug.toLowerCase().trim();
        if (isReservedSlug(normalizedSlug)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'RESERVED_SLUG',
              message: `Slug '${normalizedSlug}' is a reserved system path and cannot be used for a portfolio`,
            },
          });
          return;
        }

        // 3. Workspace membership and RBAC check
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
          res.status(404).json({
            success: false,
            error: {
              code: 'WORKSPACE_NOT_FOUND',
              message: 'Target workspace not found',
            },
          });
          return;
        }

        let role = workspace.getMemberRole(req.user!.id);
        if (req.user!.role === 'super_admin' || req.user!.role === 'admin') {
          role = 'owner';
        }

        if (!role) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied: You are not a member of this workspace',
            },
          });
          return;
        }

        if (!can(role, 'portfolio:create')) {
          res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: `Role '${role}' lacks permission for 'portfolio:create'`,
            },
          });
          return;
        }

        // 4. Check slug uniqueness
        const existingPortfolio = await Portfolio.findBySlug(normalizedSlug);
        if (existingPortfolio) {
          res.status(409).json({
            success: false,
            error: {
              code: 'SLUG_IN_USE',
              message: `Slug '${normalizedSlug}' is already in use by another portfolio`,
            },
          });
          return;
        }

        // 5. Initialize starter portfolio document
        const starterDoc = createStarterPortfolio(req.user!.id, workspaceId, normalizedSlug);

        const portfolio = new Portfolio({
          schemaVersion: starterDoc.schemaVersion,
          ownerId: new mongoose.Types.ObjectId(req.user!.id),
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
          slug: normalizedSlug,
          title: title.trim(),
          isPublished: false,
          pages: starterDoc.pages,
          theme: theme || starterDoc.theme,
          seo: seo ? { ...starterDoc.seo, ...seo } : starterDoc.seo,
          settings: starterDoc.settings,
          navigation: starterDoc.navigation,
        });

        await portfolio.save();

        res.status(201).json({
          success: true,
          data: portfolio,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CREATE_PORTFOLIO_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // GET /api/v1/portfolios — List accessible portfolios
  // ----------------------------------------------------
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { workspaceId } = req.query;

      if (workspaceId && typeof workspaceId === 'string') {
        if (!mongoose.isValidObjectId(workspaceId)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ID',
              message: 'Workspace identifier must be a valid MongoDB ObjectId',
            },
          });
          return;
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
          res.status(404).json({
            success: false,
            error: {
              code: 'WORKSPACE_NOT_FOUND',
              message: 'Target workspace not found',
            },
          });
          return;
        }

        const isSuperAdmin = req.user!.role === 'super_admin' || req.user!.role === 'admin';
        const role = workspace.getMemberRole(req.user!.id);
        if (!isSuperAdmin && !role) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied: You are not a member of this workspace',
            },
          });
          return;
        }

        const portfolios = await Portfolio.findByWorkspace(workspaceId);
        res.status(200).json({
          success: true,
          data: portfolios,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
        return;
      }

      // If no workspaceId query param, list all portfolios across user's accessible workspaces
      const accessibleWorkspaces = await Workspace.findByUser(req.user!.id);
      const workspaceIds = accessibleWorkspaces.map((w) => w._id);

      const portfolios = await Portfolio.find({
        workspaceId: { $in: workspaceIds },
      }).sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        data: portfolios,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PORTFOLIOS_ERROR',
          message: err.message,
        },
      });
    }
  });

  // ----------------------------------------------------
  // GET /api/v1/portfolios/:id — Read single portfolio
  // ----------------------------------------------------
  router.get(
    '/:id',
    requirePortfolioAccess('portfolio:read'),
    (req: Request, res: Response): void => {
      res.status(200).json({
        success: true,
        data: req.portfolio,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    }
  );

  // ----------------------------------------------------
  // PATCH /api/v1/portfolios/:id — Update portfolio metadata
  // ----------------------------------------------------
  router.patch(
    '/:id',
    requirePortfolioAccess('portfolio:update'),
    validateBody(PortfolioUpdateValidator),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        const { title, slug, seo, settings, theme } = req.body;

        // If slug is changed, check reserved and uniqueness
        if (slug !== undefined) {
          const normalizedSlug = slug.toLowerCase().trim();
          if (normalizedSlug !== portfolio.slug) {
            if (isReservedSlug(normalizedSlug)) {
              res.status(400).json({
                success: false,
                error: {
                  code: 'RESERVED_SLUG',
                  message: `Slug '${normalizedSlug}' is a reserved system path and cannot be used for a portfolio`,
                },
              });
              return;
            }

            const existingPortfolio = await Portfolio.findOne({
              slug: normalizedSlug,
              _id: { $ne: portfolio._id },
            });

            if (existingPortfolio) {
              res.status(409).json({
                success: false,
                error: {
                  code: 'SLUG_IN_USE',
                  message: `Slug '${normalizedSlug}' is already in use by another portfolio`,
                },
              });
              return;
            }

            portfolio.slug = normalizedSlug;
          }
        }

        // Apply metadata updates safely preserving nested pages and blocks
        if (title !== undefined) {
          portfolio.title = title.trim();
        }

        if (seo !== undefined) {
          portfolio.seo = {
            ...portfolio.seo,
            ...seo,
          };
        }

        if (settings !== undefined) {
          portfolio.settings = {
            ...portfolio.settings,
            ...settings,
          };
        }

        if (theme !== undefined) {
          portfolio.theme = {
            ...portfolio.theme,
            ...theme,
            colorPalette: theme.colorPalette
              ? { ...portfolio.theme.colorPalette, ...theme.colorPalette }
              : portfolio.theme.colorPalette,
          };
        }

        await portfolio.save();

        res.status(200).json({
          success: true,
          data: portfolio,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_PORTFOLIO_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  // ----------------------------------------------------
  // DELETE /api/v1/portfolios/:id — Delete portfolio
  // ----------------------------------------------------
  router.delete(
    '/:id',
    requirePortfolioAccess('portfolio:delete'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const portfolio = req.portfolio!;
        await Portfolio.findByIdAndDelete(portfolio._id);

        res.status(200).json({
          success: true,
          data: {
            id: portfolio._id.toString(),
            message: 'Portfolio deleted successfully',
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
            code: 'DELETE_PORTFOLIO_ERROR',
            message: err.message,
          },
        });
      }
    }
  );

  return router;
}
