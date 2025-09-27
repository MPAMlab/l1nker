import { jwtVerify } from 'jose';
import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';

export async function handleAdminArtists(request: Request, env: Env): Promise<Response> {
    // Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const token = authHeader.substring(7);

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET_KEY));
        const { managedProjects, userId, username, role } = payload as {
            managedProjects: string;
            userId: number;
            username: string;
            role: string;
        };

        if (request.method === 'GET') {
            return handleGetArtists(env, userId, role);
        }
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
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

        const stmt = env.l1nker_db.prepare(query);
        const { results } = role === 'admin'
            ? await stmt.all()
            : await stmt.bind(userId).all();

        if (!results) {
            return new Response(JSON.stringify({ error: 'Failed to fetch artists' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching artists:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}