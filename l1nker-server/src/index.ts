import { handleApiData } from './handlers/apiData.ts';
import { handleLogin } from './handlers/login.ts';
import { handleRegister } from './handlers/register.ts';
import { handleAdminData } from './handlers/adminData.ts';
import { handleUpload } from './handlers/upload.ts';
import { handleImageRequest } from './handlers/imageRequest.ts';
import { handleArtistProfile } from './handlers/artistProfile.ts';
import { handleArtistLinks } from './handlers/artistProfile.ts';
import { handleArtistPage } from './handlers/artistPage.ts';
import { handleAdminArtists } from './handlers/adminArtists.ts';
import { handleUserManagement } from './handlers/userManagement.ts';
import { handleChangePassword } from './handlers/changePassword.ts';
import { handleDebug } from './handlers/debug.ts';
import { Env } from './types'; // Import the Env type
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (pathname.startsWith('/api/data')) {
            const key = url.searchParams.get('key') || 'default';
            return handleApiData(key, env);
        }
        if (pathname.startsWith('/api/artist/')) {
            const key = pathname.split('/').pop() || '';
            return handleArtistPage(key, env);
        }
        if (pathname === '/api/login' && request.method === 'POST') {
            return handleLogin(request, env);
        }
        if (pathname === '/api/register' && request.method === 'POST') {
            return handleRegister(request, env);
        }
        if (pathname.startsWith('/api/admin/data')) {
            return handleAdminData(request, pathname, env);
        }
        if (pathname === '/api/admin/artists') {
            return handleAdminArtists(request, env);
        }
		if (pathname === '/api/upload' && request.method === 'POST') {
            return handleUpload(request, env);
        }
        if (pathname.startsWith('/images/')) {
            return handleImageRequest(request, env);
        }
        if (pathname.startsWith('/api/artist-profile')) {
            return handleArtistProfile(request, pathname, env);
        }
        if (pathname.startsWith('/api/artist-links')) {
            return handleArtistLinks(request, pathname, env);
        }
        if (pathname.startsWith('/api/admin/users')) {
            return handleUserManagement(request, pathname, env);
        }
        if (pathname === '/api/change-password') {
            return handleChangePassword(request, env);
        }
        if (pathname === '/api/debug') {
            return handleDebug(request, env);
        }
        // For all other request, let cloudflare handle it
        return fetch(request);
    },
};

