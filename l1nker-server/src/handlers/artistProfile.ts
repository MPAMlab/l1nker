import { jwtVerify } from 'jose';
import { Env, ArtistProfile, ArtistLink } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';

export async function handleArtistProfile(request: Request, pathname: string, env: Env): Promise<Response> {
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
        (request as AuthorizedRequest).managedProjects = managedProjects;
        (request as AuthorizedRequest).userId = userId;
        (request as AuthorizedRequest).username = username;
        (request as AuthorizedRequest).role = role;

        // Handle different methods
        if (request.method === 'GET') {
            return handleGetArtistProfile(request, pathname, env, userId, role);
        } else if (request.method === 'POST') {
            return handleCreateArtistProfile(request, env, userId);
        } else if (request.method === 'PUT') {
            return handleUpdateArtistProfile(request, pathname, env, userId, role);
        } else if (request.method === 'DELETE') {
            return handleDeleteArtistProfile(request, pathname, env, userId, role);
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

async function handleGetArtistProfile(request: Request, pathname: string, env: Env, userId: number, role: string): Promise<Response> {
    try {
        const profileId = pathname.split('/').pop();

        if (profileId && profileId !== 'artist-profile') {
            // Get specific profile
            const profile = await env.l1nker_db
                .prepare('SELECT * FROM artist_profile WHERE id = ?')
                .bind(profileId)
                .first();

            if (!profile) {
                return new Response(JSON.stringify({ message: 'Profile not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Check permissions
            if (role !== 'admin' && profile.user_id !== userId) {
                return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Get artist links
            const links = await env.l1nker_db
                .prepare('SELECT * FROM artist_links WHERE artist_profile_id = ? ORDER BY display_order')
                .bind(profileId)
                .all();

            return new Response(JSON.stringify({
                ...profile,
                links: links.results || []
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            // Get user's profile
            const profile = await env.l1nker_db
                .prepare('SELECT * FROM artist_profile WHERE user_id = ?')
                .bind(userId)
                .first();

            if (!profile) {
                return new Response(JSON.stringify({ message: 'Profile not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Get artist links
            const links = await env.l1nker_db
                .prepare('SELECT * FROM artist_links WHERE artist_profile_id = ? ORDER BY display_order')
                .bind(profile.id)
                .all();

            return new Response(JSON.stringify({
                ...profile,
                links: links.results || []
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (error) {
        console.error('Error getting artist profile:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleCreateArtistProfile(request: Request, env: Env, userId: number): Promise<Response> {
    try {
        const profileData: ArtistProfile = await request.json();

        // Check if user already has a profile
        const existingProfile = await env.l1nker_db
            .prepare('SELECT id FROM artist_profile WHERE user_id = ?')
            .bind(userId)
            .first();

        if (existingProfile) {
            return new Response(JSON.stringify({ message: 'User already has an artist profile' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if artist_page_key is unique
        if (profileData.artist_page_key) {
            const existingKey = await env.l1nker_db
                .prepare('SELECT id FROM artist_profile WHERE artist_page_key = ?')
                .bind(profileData.artist_page_key)
                .first();

            if (existingKey) {
                return new Response(JSON.stringify({ message: 'Artist page key already exists' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        const result = await env.l1nker_db
            .prepare(`
                INSERT INTO artist_profile (
                    user_id, artist_name, profile_photo_url, main_profile,
                    secondary_profile, artist_page_key
                ) VALUES (?, ?, ?, ?, ?, ?)
            `)
            .bind(
                userId,
                profileData.artist_name,
                profileData.profile_photo_url || null,
                profileData.main_profile || null,
                profileData.secondary_profile || null,
                profileData.artist_page_key || null
            )
            .run();

        if (!result.success) {
            return new Response(JSON.stringify({ error: 'Failed to create artist profile' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const newProfile = await env.l1nker_db
            .prepare('SELECT * FROM artist_profile WHERE id = ?')
            .bind(result.meta.last_row_id)
            .first();

        return new Response(JSON.stringify(newProfile), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating artist profile:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleUpdateArtistProfile(request: Request, pathname: string, env: Env, userId: number, role: string): Promise<Response> {
    try {
        const profileId = pathname.split('/').pop();
        const profileData: Partial<ArtistProfile> = await request.json();

        // Get existing profile
        const existingProfile = await env.l1nker_db
            .prepare('SELECT * FROM artist_profile WHERE id = ?')
            .bind(profileId)
            .first();

        if (!existingProfile) {
            return new Response(JSON.stringify({ message: 'Profile not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check permissions
        if (role !== 'admin' && existingProfile.user_id !== userId) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if artist_page_key is unique (if updating)
        if (profileData.artist_page_key && profileData.artist_page_key !== existingProfile.artist_page_key) {
            const existingKey = await env.l1nker_db
                .prepare('SELECT id FROM artist_profile WHERE artist_page_key = ? AND id != ?')
                .bind(profileData.artist_page_key, profileId)
                .first();

            if (existingKey) {
                return new Response(JSON.stringify({ message: 'Artist page key already exists' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        // Update profile
        const updateFields = [];
        const bindValues = [];

        if (profileData.artist_name !== undefined) {
            updateFields.push('artist_name = ?');
            bindValues.push(profileData.artist_name);
        }
        if (profileData.profile_photo_url !== undefined) {
            updateFields.push('profile_photo_url = ?');
            bindValues.push(profileData.profile_photo_url);
        }
        if (profileData.main_profile !== undefined) {
            updateFields.push('main_profile = ?');
            bindValues.push(profileData.main_profile);
        }
        if (profileData.secondary_profile !== undefined) {
            updateFields.push('secondary_profile = ?');
            bindValues.push(profileData.secondary_profile);
        }
        if (profileData.artist_page_key !== undefined) {
            updateFields.push('artist_page_key = ?');
            bindValues.push(profileData.artist_page_key);
        }

        if (updateFields.length > 0) {
            bindValues.push(profileId);
            const query = `UPDATE artist_profile SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

            await env.l1nker_db
                .prepare(query)
                .bind(...bindValues)
                .run();
        }

        const updatedProfile = await env.l1nker_db
            .prepare('SELECT * FROM artist_profile WHERE id = ?')
            .bind(profileId)
            .first();

        return new Response(JSON.stringify(updatedProfile), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating artist profile:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleDeleteArtistProfile(request: Request, pathname: string, env: Env, userId: number, role: string): Promise<Response> {
    try {
        const profileId = pathname.split('/').pop();

        // Get existing profile
        const existingProfile = await env.l1nker_db
            .prepare('SELECT * FROM artist_profile WHERE id = ?')
            .bind(profileId)
            .first();

        if (!existingProfile) {
            return new Response(JSON.stringify({ message: 'Profile not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check permissions
        if (role !== 'admin' && existingProfile.user_id !== userId) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Delete associated links first
        await env.l1nker_db
            .prepare('DELETE FROM artist_links WHERE artist_profile_id = ?')
            .bind(profileId)
            .run();

        // Delete profile
        await env.l1nker_db
            .prepare('DELETE FROM artist_profile WHERE id = ?')
            .bind(profileId)
            .run();

        // Update landing pages that reference this profile
        await env.l1nker_db
            .prepare('UPDATE landing_page SET artist_profile_id = NULL, show_artist_section = 0 WHERE artist_profile_id = ?')
            .bind(profileId)
            .run();

        return new Response(JSON.stringify({ message: 'Profile deleted successfully' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error deleting artist profile:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function handleArtistLinks(request: Request, pathname: string, env: Env): Promise<Response> {
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
        const { userId, role } = payload as { userId: number; role: string; };

        if (request.method === 'POST') {
            return handleCreateArtistLink(request, env, userId, role);
        } else if (request.method === 'PUT') {
            return handleUpdateArtistLink(request, env, userId, role);
        } else if (request.method === 'DELETE') {
            return handleDeleteArtistLink(request, pathname, env, userId, role);
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

async function handleCreateArtistLink(request: Request, env: Env, userId: number, role: string): Promise<Response> {
    try {
        const linkData: ArtistLink = await request.json();

        // Verify artist profile ownership
        const profile = await env.l1nker_db
            .prepare('SELECT user_id FROM artist_profile WHERE id = ?')
            .bind(linkData.artist_profile_id)
            .first();

        if (!profile) {
            return new Response(JSON.stringify({ message: 'Artist profile not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (role !== 'admin' && profile.user_id !== userId) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = await env.l1nker_db
            .prepare(`
                INSERT INTO artist_links (artist_profile_id, platform_name, url, display_order)
                VALUES (?, ?, ?, ?)
            `)
            .bind(
                linkData.artist_profile_id,
                linkData.platform_name,
                linkData.url,
                linkData.display_order || 0
            )
            .run();

        const newLink = await env.l1nker_db
            .prepare('SELECT * FROM artist_links WHERE id = ?')
            .bind(result.meta.last_row_id)
            .first();

        return new Response(JSON.stringify(newLink), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating artist link:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleUpdateArtistLink(request: Request, env: Env, userId: number, role: string): Promise<Response> {
    try {
        const linkData: Partial<ArtistLink> = await request.json();
        const linkId = pathname.split('/').pop();

        // Get link and verify ownership
        const link = await env.l1nker_db
            .prepare(`
                SELECT al.*, ap.user_id
                FROM artist_links al
                JOIN artist_profile ap ON al.artist_profile_id = ap.id
                WHERE al.id = ?
            `)
            .bind(linkId)
            .first();

        if (!link) {
            return new Response(JSON.stringify({ message: 'Link not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (role !== 'admin' && link.user_id !== userId) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Update link
        await env.l1nker_db
            .prepare(`
                UPDATE artist_links
                SET platform_name = ?, url = ?, display_order = ?
                WHERE id = ?
            `)
            .bind(
                linkData.platform_name!,
                linkData.url!,
                linkData.display_order || 0,
                linkId
            )
            .run();

        const updatedLink = await env.l1nker_db
            .prepare('SELECT * FROM artist_links WHERE id = ?')
            .bind(linkId)
            .first();

        return new Response(JSON.stringify(updatedLink), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating artist link:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleDeleteArtistLink(request: Request, pathname: string, env: Env, userId: number, role: string): Promise<Response> {
    try {
        const linkId = pathname.split('/').pop();

        // Get link and verify ownership
        const link = await env.l1nker_db
            .prepare(`
                SELECT al.*, ap.user_id
                FROM artist_links al
                JOIN artist_profile ap ON al.artist_profile_id = ap.id
                WHERE al.id = ?
            `)
            .bind(linkId)
            .first();

        if (!link) {
            return new Response(JSON.stringify({ message: 'Link not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (role !== 'admin' && link.user_id !== userId) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await env.l1nker_db
            .prepare('DELETE FROM artist_links WHERE id = ?')
            .bind(linkId)
            .run();

        return new Response(JSON.stringify({ message: 'Link deleted successfully' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error deleting artist link:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}