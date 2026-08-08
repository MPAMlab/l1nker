import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';
import { validatePermissions } from '../utils/permissions';

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const authResult = await validatePermissions(request, env);
  if (!authResult.authorized) {
    return authResult.error!;
  }
  const req = request as AuthorizedRequest;
  return new Response(
    JSON.stringify({ userId: req.userId, username: req.username, role: req.role || 'user' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
