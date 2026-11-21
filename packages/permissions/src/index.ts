import type { WorkspaceRole } from '@pagecraft/types';

export type Role = WorkspaceRole | 'admin';

export type Action =
  | 'portfolio:create'
  | 'portfolio:read'
  | 'portfolio:update'
  | 'portfolio:delete'
  | 'portfolio:publish'
  | 'portfolio:duplicate'
  | 'workspace:invite'
  | 'workspace:remove_member'
  | 'workspace:change_role'
  | 'billing:manage'
  | 'domain:manage'
  | 'audit:read'
  | 'admin:override';

export const PERMISSION_MATRIX: Record<Role, readonly Action[]> = {
  admin: [
    'portfolio:create',
    'portfolio:read',
    'portfolio:update',
    'portfolio:delete',
    'portfolio:publish',
    'portfolio:duplicate',
    'workspace:invite',
    'workspace:remove_member',
    'workspace:change_role',
    'billing:manage',
    'domain:manage',
    'audit:read',
    'admin:override'
  ],
  owner: [
    'portfolio:create',
    'portfolio:read',
    'portfolio:update',
    'portfolio:delete',
    'portfolio:publish',
    'portfolio:duplicate',
    'workspace:invite',
    'workspace:remove_member',
    'workspace:change_role',
    'billing:manage',
    'domain:manage',
    'audit:read'
  ],
  editor: [
    'portfolio:create',
    'portfolio:read',
    'portfolio:update',
    'portfolio:publish',
    'portfolio:duplicate'
  ],
  viewer: [
    'portfolio:read'
  ]
} as const;

export function can(role: Role, action: Action): boolean {
  const allowed = PERMISSION_MATRIX[role];
  return allowed ? allowed.includes(action) : false;
}

export function assertPermission(role: Role, action: Action): void {
  if (!can(role, action)) {
    throw new Error(`Forbidden: Role '${role}' lacks permission for '${action}'`);
  }
}
