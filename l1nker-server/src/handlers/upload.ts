import { jwtVerify } from 'jose';
import { Env } from '../types';

// Add CORS headers to response
function addCorsHeaders(response: Response, env: Env): Response {
    const corsHeaders = {
        'Access-Control-Allow-Origin': env.CORS_ALLOWED_ORIGINS?.[0] || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
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

export async function handleUpload(request: Request, env: Env): Promise<Response> {
    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
        return addCorsHeaders(new Response(null, { status: 200 }), env);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return addCorsHeaders(new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        }), env);
    }
    const token = authHeader.substring(7);
    let payload;
    try {
        const result = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET_KEY));
        payload = result.payload;
    } catch (error) {
        return addCorsHeaders(new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        }), env);
    }

    // Check if user has upload permissions
    const { role, managedProjects } = payload as {
        role?: string;
        managedProjects: string;
    };

    // All authenticated users can upload images, but we log the action
    console.log(`Upload attempt by user with role: ${role || 'user'}, managed projects: ${managedProjects}`);

    try {
        // 2. 获取 FormData 和文件 (保持不变)
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return addCorsHeaders(new Response(JSON.stringify({ message: "No file uploaded" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }), env);
        }
         if (file.size > 5 * 1024 * 1024) { // 5MB = 5 * 1024 * 1024 bytes
            return addCorsHeaders(new Response(JSON.stringify({ message: "File size exceeds 5MB limit" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }), env);
        }
        const fileBuffer = await file.arrayBuffer();
        const fileName = `${crypto.randomUUID()}-${file.name}`;

        await env.MY_R2_BUCKET.put(fileName, fileBuffer,{
           httpMetadata: {
              contentType: file.type,
           },
        });
        return addCorsHeaders(new Response(JSON.stringify({
            message: "File uploaded successfully",
            imageUrl: fileName
        }), {
            headers: {
                'Content-Type': 'application/json',
            },
        }), env);

    } catch (e) {
         console.error("Error uploading file:", e); // 记录错误信息，方便调试
        return addCorsHeaders(new Response(JSON.stringify({ message: "Failed to upload file", error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        }), env);
    }
}
