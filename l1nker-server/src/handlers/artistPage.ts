import { Env } from '../types';

export async function handleArtistPage(key: string, env: Env): Promise<Response> {
    try {
        // Get artist profile by artist_page_key
        const profile = await env.l1nker_db
            .prepare(`
                SELECT
                    ap.*,
                    u.username as owner_username
                FROM artist_profile ap
                LEFT JOIN l1nker_user u ON ap.user_id = u.id
                WHERE ap.artist_page_key = ?
            `)
            .bind(key)
            .first();

        if (!profile) {
            return new Response(JSON.stringify({ error: `No artist found for key: ${key}` }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Get artist links
        const linksResult = await env.l1nker_db
            .prepare(`
                SELECT platform_name, url, display_order
                FROM artist_links
                WHERE artist_profile_id = ?
                ORDER BY display_order
            `)
            .bind(profile.id)
            .all();

        return new Response(JSON.stringify({
            ...profile,
            links: linksResult.results || []
        }), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error fetching artist page:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}