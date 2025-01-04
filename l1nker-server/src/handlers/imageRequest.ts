import { Env } from '../types';
export async function handleImageRequest(request: Request, env: Env): Promise<Response> {

    try {
        // 2. 获取图片路径
        const url = new URL(request.url);
        const imageName = url.pathname.substring('/images/'.length);

        // 3. 使用 R2 API 获取图片
        const object = await env.MY_R2_BUCKET.get(imageName);

        // 4. 返回图片
        if (object === null) {
           return new Response(JSON.stringify({ message: "Image not found" }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
             });
        }
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存一年
       return new Response(object.body, {
           headers,
        });

    } catch (e) {
        console.error("Error fetching image:", e);
          return new Response(JSON.stringify({ message: "Failed to fetch image", error: e.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
    }
   }

