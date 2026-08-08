import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';
import { validatePermissions } from '../utils/permissions';
import { hashPassword, verifyPassword } from '../utils/auth';

export async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  const authResult = await validatePermissions(request, env);
  if (!authResult.authorized) {
    return authResult.error!;
  }

  const userId = (request as AuthorizedRequest).userId;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { currentPassword, newPassword } = await request.json() as { currentPassword: string; newPassword: string };

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ message: 'Current password and new password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ message: 'New password must be at least 6 characters long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current user
    const user = await env.l1nker_db
      .prepare('SELECT password FROM l1nker_user WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify current password using PBKDF2
    const passwordMatch = await verifyPassword(currentPassword, user.password as string, env);
    if (!passwordMatch) {
      return new Response(JSON.stringify({ message: 'Current password is incorrect' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash new password using PBKDF2
    const newPasswordHash = await hashPassword(newPassword, env);

    // Update password
    const result = await env.l1nker_db
      .prepare('UPDATE l1nker_user SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(newPasswordHash, userId)
      .run();

    if (!result || !result.success) {
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}