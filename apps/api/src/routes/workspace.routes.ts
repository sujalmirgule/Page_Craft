import { Router, Request, Response } from 'express';
import { Workspace } from '../models/Workspace';
import { User } from '../models/User';
import { authenticate } from '../middleware/authenticate';
import { requireWorkspaceMember } from '../middleware/rbac';
import { inviteRateLimiter } from '../auth/rate-limiter';
import type { ApiResponse, WorkspaceRole } from '@pagecraft/types';
import mongoose from 'mongoose';

export function createWorkspaceRouter(jwtAccessSecret: string): Router {
  const router = Router();

  // All workspace routes require valid authentication
  router.use(authenticate(jwtAccessSecret));

  // ----------------------------------------------------
  // GET /api/v1/workspaces — List accessible workspaces
  // ----------------------------------------------------
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaces = await Workspace.findByUser(req.user!.id);
      res.status(200).json({
        success: true,
        data: workspaces,
        meta: { timestamp: new Date().toISOString(), version: '1.0.0' },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: err.message },
      });
    }
  });

  // ----------------------------------------------------
  // POST /api/v1/workspaces — Create new workspace
  // ----------------------------------------------------
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Workspace name is required' },
        });
        return;
      }

      const safeSlug =
        slug && typeof slug === 'string'
          ? slug.toLowerCase().trim()
          : `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

      const existing = await Workspace.findOne({ slug: safeSlug });
      if (existing) {
        res.status(400).json({
          success: false,
          error: { code: 'SLUG_IN_USE', message: 'Workspace slug is already in use' },
        });
        return;
      }

      const workspace = new Workspace({
        name: name.trim(),
        slug: safeSlug,
        ownerId: req.user!.id,
        members: [
          {
            userId: req.user!.id,
            role: 'owner',
            joinedAt: new Date(),
          },
        ],
      });
      await workspace.save();

      res.status(201).json({
        success: true,
        data: workspace,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: err.message },
      });
    }
  });

  // ----------------------------------------------------
  // GET /api/v1/workspaces/:id — Workspace details
  // ----------------------------------------------------
  router.get('/:id', requireWorkspaceMember('viewer'), (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      data: {
        workspace: req.workspace,
        userRole: req.workspaceRole,
      },
    });
  });

  // ----------------------------------------------------
  // POST /api/v1/workspaces/:id/invites — Invite member
  // ----------------------------------------------------
  router.post('/:id/invites', inviteRateLimiter, requireWorkspaceMember('owner'), async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role } = req.body;
      if (!email || !role || !['editor', 'viewer'].includes(role)) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Valid email and role (editor, viewer) are required' },
        });
        return;
      }

      const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (!targetUser) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'No registered user found with that email' },
        });
        return;
      }

      const workspace = req.workspace!;
      if (workspace.hasMember(targetUser._id)) {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_MEMBER', message: 'User is already a member of this workspace' },
        });
        return;
      }

      workspace.members.push({
        userId: targetUser._id,
        role: role as WorkspaceRole,
        joinedAt: new Date(),
      });
      await workspace.save();

      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INVITE_ERROR', message: err.message },
      });
    }
  });

  // ----------------------------------------------------
  // PATCH /api/v1/workspaces/:id/members/:userId — Update role
  // ----------------------------------------------------
  router.patch('/:id/members/:userId', requireWorkspaceMember('owner'), async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!mongoose.isValidObjectId(userId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Member userId must be a valid MongoDB ObjectId' },
        });
        return;
      }

      if (!role || !['editor', 'viewer'].includes(role)) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Valid role (editor, viewer) is required' },
        });
        return;
      }

      const workspace = req.workspace!;
      if (workspace.ownerId.toString() === userId) {
        res.status(400).json({
          success: false,
          error: { code: 'CANNOT_DEMOTE_OWNER', message: 'Cannot demote the primary workspace owner' },
        });
        return;
      }

      const member = workspace.members.find((m) => m.userId.toString() === userId);
      if (!member) {
        res.status(404).json({
          success: false,
          error: { code: 'MEMBER_NOT_FOUND', message: 'User is not a member of this workspace' },
        });
        return;
      }

      member.role = role as WorkspaceRole;
      await workspace.save();

      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ROLE_ERROR', message: err.message },
      });
    }
  });

  // ----------------------------------------------------
  // DELETE /api/v1/workspaces/:id/members/:userId — Remove member
  // ----------------------------------------------------
  router.delete('/:id/members/:userId', requireWorkspaceMember('owner'), async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!mongoose.isValidObjectId(userId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Member userId must be a valid MongoDB ObjectId' },
        });
        return;
      }

      const workspace = req.workspace!;

      if (workspace.ownerId.toString() === userId) {
        res.status(400).json({
          success: false,
          error: { code: 'CANNOT_REMOVE_OWNER', message: 'Cannot remove the primary workspace owner' },
        });
        return;
      }

      const initialCount = workspace.members.length;
      workspace.members = workspace.members.filter((m) => m.userId.toString() !== userId);

      if (workspace.members.length === initialCount) {
        res.status(404).json({
          success: false,
          error: { code: 'MEMBER_NOT_FOUND', message: 'User is not a member of this workspace' },
        });
        return;
      }

      await workspace.save();

      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'REMOVE_MEMBER_ERROR', message: err.message },
      });
    }
  });

  return router;
}
