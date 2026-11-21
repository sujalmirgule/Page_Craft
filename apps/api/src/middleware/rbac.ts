import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Workspace, IWorkspaceDocument } from '../models/Workspace';
import { Portfolio, IPortfolioDocument } from '../models/Portfolio';
import { can, Action } from '@pagecraft/permissions';
import type { ApiResponse, WorkspaceRole } from '@pagecraft/types';

declare global {
  namespace Express {
    interface Request {
      workspace?: IWorkspaceDocument;
      workspaceRole?: WorkspaceRole;
      portfolio?: IPortfolioDocument;
    }
  }
}

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Enforce that authenticated user is an authorized member of target workspace
 */
export function requireWorkspaceMember(minimumRole: WorkspaceRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      // Platform Super Admin Bypass
      if (req.user.role === 'super_admin' || req.user.role === 'admin') {
        const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
        if (workspaceId) {
          const ws = await Workspace.findById(workspaceId);
          if (ws) {
            req.workspace = ws;
            req.workspaceRole = 'owner';
          }
        }
        next();
        return;
      }

      const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
      if (!workspaceId) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Workspace identifier is required' },
        });
        return;
      }

      if (!mongoose.isValidObjectId(workspaceId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Workspace identifier must be a valid MongoDB ObjectId' },
        });
        return;
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Target workspace not found' },
        });
        return;
      }

      const role = workspace.getMemberRole(req.user.id);
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

      // Check role hierarchy
      if (ROLE_RANK[role] < ROLE_RANK[minimumRole]) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Action requires minimum workspace role of '${minimumRole}'. Your role is '${role}'.`,
          },
        });
        return;
      }

      req.workspace = workspace;
      req.workspaceRole = role;
      next();
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  };
}

/**
 * Enforce that authenticated user has required RBAC action permission on a Portfolio
 */
export function requirePortfolioAccess(action: Action) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      // Platform Super Admin Bypass
      if (req.user.role === 'super_admin' || req.user.role === 'admin') {
        const portfolioId = req.params.portfolioId || req.params.id;
        if (portfolioId) {
          const port = await Portfolio.findById(portfolioId);
          if (port) req.portfolio = port;
        }
        next();
        return;
      }

      const portfolioId = req.params.portfolioId || req.params.id;
      if (!portfolioId) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Portfolio identifier is required' },
        });
        return;
      }

      if (!mongoose.isValidObjectId(portfolioId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Portfolio identifier must be a valid MongoDB ObjectId' },
        });
        return;
      }

      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Portfolio not found' },
        });
        return;
      }

      // Load parent workspace to resolve member role
      const workspace = await Workspace.findById(portfolio.workspaceId);
      if (!workspace) {
        res.status(404).json({
          success: false,
          error: { code: 'WORKSPACE_NOT_FOUND', message: 'Parent workspace not found' },
        });
        return;
      }

      const role = workspace.getMemberRole(req.user.id);
      if (!role) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cross-workspace access denied: You are not a member of the containing workspace',
          },
        });
        return;
      }

      // Strict RBAC check via @pagecraft/permissions
      if (!can(role, action)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Forbidden: Role '${role}' lacks permission for '${action}'`,
          },
        });
        return;
      }

      req.portfolio = portfolio;
      req.workspace = workspace;
      req.workspaceRole = role;
      next();
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  };
}

/**
 * Enforce Platform Super Admin privileges
 */
export function requireSuperAdmin() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_SUPER_ADMIN',
          message: 'Access restricted to Platform Super Administrators',
        },
      });
      return;
    }

    next();
  };
}
