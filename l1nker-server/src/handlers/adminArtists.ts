import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';
import { validatePermissions } from '../utils/permissions';

export async function handleAdminArtists(request: Request, env: Env): Promise<Response> {
    // Authentication check (IDaaS OAuth)
    const authResult = await validatePermissions(request, env);
    if (!authResult.authorized) {
        return authResult.error!;
    }

    const userId = (request as AuthorizedRequest).userId;
    const role = (request as AuthorizedRequest).role || 'user';

    if (request.method === 'GET') {
        return handleGetArtists(env, userId, role);
    }

    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function handleGetArtists(env: Env, userId: number, role: string): Promise<Response> {
    try {
        let query;
        if (role === 'admin') {
            // Admin can see all artists
            query = `
                SELECT
                    ap.*,
                    u.username as owner_username
                FROM artist_profile ap
                LEFT JOIN l1nker_user u ON ap.user_id = u.id
                ORDER BY ap.artist_name
            `;
        } else {
            // Regular users can only see their own artist profile
            query = `
                SELECT
                    ap.*,
                    u.username as owner_username
                FROM artist_profile ap
                LEFT JOIN l1nker_user u ON ap.user_id = u.id
                WHERE ap.user_id = ?
                ORDER BY ap.artist_name
            `;
        }

        if (!env.l1nker_db) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const stmt = env.l1nker_db.prepare(query);
        const { results, success, error } = role === 'admin'
            ? await stmt.all()
            : await stmt.bind(userId).all();

        if (!success || error) {
            console.error('Database query failed:', error);
            return new Response(JSON.stringify({ error: 'Failed to fetch artists', details: error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Return empty array if no results, not null
        return new Response(JSON.stringify(results || []), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching artists:', error);
        return new Response(JSON.stringify({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}