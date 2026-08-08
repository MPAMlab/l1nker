import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';
import { authenticateOAuth } from './oauth';

export interface PermissionCheckOptions {
  requireAdmin?: boolean;
  requireProjectAccess?: boolean;
  allowedRoles?: string[];
}

export interface JwtPayload {
  userId: number;
  username: string;
  role?: string;
  managedProjects: string;
}

interface L1nkerUserRow {
  id: number;
  username: string;
  role?: string;
  managed_projects: string;
}

export async function validatePermissions(
  request: Request,
  env: Env,
  options: PermissionCheckOptions = {}
): Promise<{ authorized: boolean; error?: Response; payload?: JwtPayload }> {
  // 1. Validate the IDaaS OAuth token (auth.mpam-lab.xyz).
  const auth = await authenticateOAuth(request, env);
  if (!auth) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  // 2. Map the IDaaS username to an l1nker account (roles/permissions live here).
  let user: L1nkerUserRow | null = null;
  try {
    user = await env.l1nker_db
      .prepare('SELECT id, username, role, managed_projects FROM l1nker_user WHERE username = ?')
      .bind(auth.username)
      .first<L1nkerUserRow>();
  } catch (error) {
    console.error('Failed to look up l1nker user:', error);
  }
  if (!user) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'No l1nker account for this user' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role || 'user',
    managedProjects: user.managed_projects,
  };

  // Check role-based permissions
  if (options.requireAdmin && payload.role !== 'admin') {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  // Check specific role requirements
  if (options.allowedRoles && payload.role && !options.allowedRoles.includes(payload.role)) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  // Attach payload to authorized request
  (request as AuthorizedRequest).userId = payload.userId;
  (request as AuthorizedRequest).username = payload.username;
  (request as AuthorizedRequest).role = payload.role;
  (request as AuthorizedRequest).managedProjects = payload.managedProjects;

  return { authorized: true, payload };
}

export async function validateProjectAccess(
  request: Request,
  env: Env,
  redirectKey: string
): Promise<{ authorized: boolean; error?: Response }> {
  const authResult = await validatePermissions(request, env);
  if (!authResult.authorized) {
    return authResult;
  }

  const { payload } = authResult;
  if (!payload) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  // Admin can access any project
  if (payload.role === 'admin' || payload.managedProjects === '*') {
    return { authorized: true };
  }

  // Check if user has access to this specific project
  const projectKeys = payload.managedProjects.split(',').map(key => key.trim()).filter(key => key);
  if (!projectKeys.includes(redirectKey)) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { authorized: true };
}
