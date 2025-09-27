import { jwtVerify } from 'jose';
import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';

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

export async function validatePermissions(
  request: Request,
  env: Env,
  options: PermissionCheckOptions = {}
): Promise<{ authorized: boolean; error?: Response; payload?: JwtPayload }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const token = authHeader.substring(7);
  let payload;
  try {
    const result = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET_KEY));
    payload = result.payload as JwtPayload;
  } catch (error) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

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