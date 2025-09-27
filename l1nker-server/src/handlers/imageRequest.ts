import { Env } from '../types';

// Add CORS headers to response
function addCorsHeaders(response: Response, env: Env): Response {
    const corsHeaders = {
        'Access-Control-Allow-Origin': env.CORS_ALLOWED_ORIGINS?.[0] || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

export async function handleImageRequest(request: Request, env: Env): Promise<Response> {
    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
        return addCorsHeaders(new Response(null, { status: 200 }), env);
    }

    try {
        // 2. 获取图片路径
        const url = new URL(request.url);
        const imageName = url.pathname.substring('/images/'.length);

        // 3. 使用 R2 API 获取图片
        const object = await env.MY_R2_BUCKET.get(imageName);

        // 4. 返回图片
        if (object === null) {
           return addCorsHeaders(new Response(JSON.stringify({ message: "Image not found" }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
             }), env);
        }
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存一年
       return addCorsHeaders(new Response(object.body, {
           headers,
        }), env);

    } catch (e) {
        console.error("Error fetching image:", e);
          return addCorsHeaders(new Response(JSON.stringify({ message: "Failed to fetch image", error: e.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }), env);
    }
   }

