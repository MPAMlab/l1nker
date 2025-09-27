import { jwtVerify } from 'jose';
import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';
import { validatePermissions } from '../utils/permissions';
import { hashPassword } from '../utils/auth';

export async function handleUserManagement(request: Request, pathname: string, env: Env): Promise<Response> {
  // Only admins can access user management
  const authResult = await validatePermissions(request, env, { requireAdmin: true });
  if (!authResult.authorized) {
    return authResult.error!;
  }

  if (request.method === 'GET') {
    return handleGetUsers(request, env);
  }

  if (request.method === 'POST') {
    return handleCreateUser(request, env);
  }

  if (request.method === 'PUT') {
    return handleUpdateUser(request, pathname, env);
  }

  if (request.method === 'DELETE') {
    return handleDeleteUser(request, pathname, env);
  }

  return new Response(JSON.stringify({ message: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGetUsers(request: Request, env: Env): Promise<Response> {
  try {
    const query = `
      SELECT
        id,
        username,
        email,
        role,
        managedProjects,
        created_at
      FROM l1nker_user
      ORDER BY created_at DESC
    `;

    const { results } = await env.l1nker_db.prepare(query).all();

    if (!results) {
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Remove password hashes from response
    const users = results.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      managedProjects: user.managedProjects,
      created_at: user.created_at
    }));

    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleCreateUser(request: Request, env: Env): Promise<Response> {
  try {
    const { username, email, password, role, managedProjects } = await request.json();

    // Validate required fields
    if (!username || !email || !password || !role) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return new Response(JSON.stringify({ message: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const existingUser = await env.l1nker_db
      .prepare('SELECT id FROM l1nker_user WHERE username = ? OR email = ?')
      .bind(username, email)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({ message: 'Username or email already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password using PBKDF2 (same as existing system)
    const passwordHash = await hashPassword(password, env);

    // Set default managedProjects based on role
    const projects = managedProjects || (role === 'admin' ? '*' : '');

    // Create user
    const result = await env.l1nker_db
      .prepare(`
        INSERT INTO l1nker_user (username, email, password_hash, role, managedProjects)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(username, email, passwordHash, role, projects)
      .run();

    if (!result || !result.success) {
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      message: 'User created successfully',
      userId: result.meta.last_row_id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleUpdateUser(request: Request, pathname: string, env: Env): Promise<Response> {
  try {
    const userId = pathname.split('/').pop();
    const { email, role, managedProjects, password } = await request.json();

    // Check if user exists
    const existingUser = await env.l1nker_db
      .prepare('SELECT id FROM l1nker_user WHERE id = ?')
      .bind(userId)
      .first();

    if (!existingUser) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build update query dynamically
    let updateFields = [];
    let bindValues = [];

    if (email) {
      updateFields.push('email = ?');
      bindValues.push(email);
    }

    if (role) {
      if (!['admin', 'user'].includes(role)) {
        return new Response(JSON.stringify({ message: 'Invalid role' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateFields.push('role = ?');
      bindValues.push(role);
    }

    if (managedProjects !== undefined) {
      updateFields.push('managedProjects = ?');
      bindValues.push(managedProjects);
    }

    if (password) {
      // Hash password using PBKDF2 (same as existing system)
      const passwordHash = await hashPassword(password, env);
      updateFields.push('password_hash = ?');
      bindValues.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const query = `UPDATE l1nker_user SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    bindValues.push(userId);

    const result = await env.l1nker_db.prepare(query).bind(...bindValues).run();

    if (!result || !result.success) {
      return new Response(JSON.stringify({ error: 'Failed to update user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'User updated successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleDeleteUser(request: Request, pathname: string, env: Env): Promise<Response> {
  try {
    const userId = pathname.split('/').pop();

    // Prevent deleting self
    const currentUser = (request as AuthorizedRequest).userId;
    if (parseInt(userId) === currentUser) {
      return new Response(JSON.stringify({ message: 'Cannot delete your own account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists
    const existingUser = await env.l1nker_db
      .prepare('SELECT id FROM l1nker_user WHERE id = ?')
      .bind(userId)
      .first();

    if (!existingUser) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete user
    const result = await env.l1nker_db
      .prepare('DELETE FROM l1nker_user WHERE id = ?')
      .bind(userId)
      .run();

    if (!result || !result.success) {
      return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}