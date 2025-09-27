import { Env } from '../types';

export async function handleDebug(request: Request, env: Env): Promise<Response> {
    try {
        // Test database connection
        if (!env.l1nker_db) {
            return new Response(JSON.stringify({
                error: 'Database binding not available',
                bindings: Object.keys(env)
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Test simple query
        const testQuery = await env.l1nker_db.prepare('SELECT COUNT(*) as count FROM l1nker_user').first();

        // Test users query
        const usersQuery = `
            SELECT
                id,
                username,
                email,
                role,
                managed_projects,
                created_at
            FROM l1nker_user
            ORDER BY created_at DESC
        `;

        const { results, success, error } = await env.l1nker_db.prepare(usersQuery).all();

        return new Response(JSON.stringify({
            databaseTest: {
                testQueryResult: testQuery,
                usersQuerySuccess: success,
                usersQueryError: error,
                usersCount: results?.length || 0
            },
            env: {
                hasDb: !!env.l1nker_db,
                hasR2: !!env.MY_R2_BUCKET,
                hasJwt: !!env.JWT_SECRET_KEY
            }
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({
            error: 'Debug endpoint failed',
            details: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}