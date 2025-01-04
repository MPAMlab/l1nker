import { handleApiData } from './handlers/apiData.ts';
import { handleLogin } from './handlers/login.ts';
import { handleRegister } from './handlers/register.ts';
import { handleAdminData } from './handlers/adminData.ts';
import { handleUpload } from './handlers/upload.ts';
import { handleImageRequest } from './handlers/imageRequest.ts';
import { Env } from './types'; // Import the Env type
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (pathname.startsWith('/api/data')) {
            const key = url.searchParams.get('key') || 'default';
            return handleApiData(key, env);
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
		if (pathname === '/api/upload' && request.method === 'POST') {
            return handleUpload(request, env);
        }
        if (pathname.startsWith('/images/')) {
            return handleImageRequest(request, env);
        }
        // For all other request, let cloudflare handle it
        return fetch(request);
    },
};

