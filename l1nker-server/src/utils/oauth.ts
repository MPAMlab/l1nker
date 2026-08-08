import { getOAuthApi } from '@cloudflare/workers-oauth-provider';
import { Env } from '../types';

// Provider options are only used to bind helpers to the shared OAUTH_KV; the
// token validation reads tokens issued by auth.mpam-lab.xyz.
const oauthOptions = {
  apiRoute: '/__unused__',
  apiHandler: { fetch: () => new Response('not found', { status: 404 }) },
  defaultHandler: { fetch: () => new Response('not found', { status: 404 }) },
  authorizeEndpoint: 'https://auth.mpam-lab.xyz/authorize',
  tokenEndpoint: 'https://auth.mpam-lab.xyz/oauth/token',
} as unknown as Parameters<typeof getOAuthApi>[0];

/**
 * Validates a Bearer token issued by the MPAM IDaaS (auth.mpam-lab.xyz)
 * against the shared OAUTH_KV namespace. Returns the IDaaS username, or null.
 */
export async function authenticateOAuth(request: Request, env: Env): Promise<{ username: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    const helpers = getOAuthApi(oauthOptions, env);
    const summary = await helpers.unwrapToken(token);
    if (!summary) return null;
    const props = (summary.grant?.props ?? {}) as { username?: string };
    return props.username ? { username: props.username } : null;
  } catch (err) {
    console.error('OAuth token validation failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
