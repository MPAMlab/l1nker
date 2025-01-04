import { jwtVerify } from 'jose';
import { Env } from '../types';

export async function handleUpload(request: Request, env: Env): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const token = authHeader.substring(7);
    try {
        await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET_KEY));
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 2. 获取 FormData 和文件 (保持不变)
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return new Response(JSON.stringify({ message: "No file uploaded" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
         if (file.size > 5 * 1024 * 1024) { // 5MB = 5 * 1024 * 1024 bytes
            return new Response(JSON.stringify({ message: "File size exceeds 5MB limit" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const fileBuffer = await file.arrayBuffer();
        const fileName = `${crypto.randomUUID()}-${file.name}`;

        await env.MY_R2_BUCKET.put(fileName, fileBuffer,{
           httpMetadata: {
              contentType: file.type,
           },
        });
        return new Response(JSON.stringify({ message: "File uploaded successfully" }), {
            headers: {
                'Content-Type': 'application/json',
            },
        });

    } catch (e) {
         console.error("Error uploading file:", e); // 记录错误信息，方便调试
        return new Response(JSON.stringify({ message: "Failed to upload file", error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
