import { SignJWT, jwtVerify } from 'jose';

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

async function handleApiData(key: string, env: Env): Promise<Response> {
    try {
        const query = `
            SELECT
                profileImageUrl,
                title,
                subtitle,
                buttons,
                buttonColor,
                faviconUrl,
                pageTitle
            FROM
                landing_page
            WHERE
                redirectKey = ?;
        `;
        const { results } = await env?.l1nker_db?.prepare(query).bind(key).all();
        if (!results) {
            return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (results.length === 0) {
            return new Response(JSON.stringify({ error: `No data found for key: ${key}` }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const data = results[0];
        return new Response(
            JSON.stringify({
                ...data,
                buttons: JSON.parse(data.buttons),
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
async function handleImageRequest(request: Request, env: Env): Promise<Response> {

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
async function handleUpload(request: Request, env: Env): Promise<Response> {
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

async function handleLogin(request: Request, env: Env): Promise<Response> {
    try {
        const { username, password } = await request.json() as { username: string; password: string };
        const query = `SELECT id, username, password, managed_projects FROM l1nker_user WHERE username = ?`;
        const { results } = await env?.l1nker_db?.prepare(query).bind(username).all();
        if (!results) {
            return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (results.length === 0) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const user = results[0];
        console.log("数据库中的哈希密码:", user.password);
        // 使用 PBKDF2 进行密码校验
        const passwordMatch = await verifyPassword(password, user.password, env);
        console.log("用户输入密码的哈希结果：", passwordMatch);
        if (!passwordMatch) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const jwtPayload = {
            userId: user.id,
            username: user.username,
            managedProjects: user.managed_projects,
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 过期时间：1小时
        };
        const token = await new SignJWT(jwtPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(new TextEncoder().encode(env.JWT_SECRET_KEY));

        return new Response(JSON.stringify({ token }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Failed to process login request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
    try {
        const { username, password } = await request.json() as { username: string; password: string };
        const hashedPassword = await hashPassword(password, env);
        const query = `
            INSERT INTO l1nker_user (username, password)
            VALUES (?, ?);
        `;
        const dbResult = await env?.l1nker_db?.prepare(query).bind(username, hashedPassword).run();
        if (!dbResult) {
            return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response(JSON.stringify({ message: 'Successfully registered' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

interface AuthorizedRequest extends Request {
    managedProjects: string | Array<{ redirectKey: string }>;
    userId: number;
    username: string;
}

async function handleAdminData(request: Request, pathname: string, env: Env): Promise<Response> {
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
        const { managedProjects, userId, username } = payload as { managedProjects: string; userId: number; username: string };
        (request as AuthorizedRequest).managedProjects = managedProjects;
        (request as AuthorizedRequest).userId = userId;
        (request as AuthorizedRequest).username = username;
        if (managedProjects !== '*') {
            //查询用户可以管理的项目列表
            const query = `SELECT * FROM landing_page WHERE redirectKey IN (${managedProjects
                .split(',')
                .map((key) => `'${key}'`)
                .join(',')})`;
            const { results } = await env?.l1nker_db?.prepare(query).all();
            if (!results) {
                return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            //判断是否有权限
            if (!results || results.length === 0) {
                return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            (request as AuthorizedRequest).managedProjects = results;
        }
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 如果验证通过，则继续处理请求
    // 数据库查询和更新代码
    try {
        if (request.method === 'GET') {
            let query;
            if ((request as AuthorizedRequest).managedProjects === '*') {
                query = `SELECT * FROM landing_page`;
            } else {
                query = `SELECT * FROM landing_page WHERE redirectKey IN (${(request as AuthorizedRequest).managedProjects
                    .map((item) => `'${item.redirectKey}'`)
                    .join(',')})`;
            }
            const { results } = await env?.l1nker_db?.prepare(query).all();
            if (!results) {
                return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return new Response(JSON.stringify(results), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        if (request.method === 'POST') {
             const newItem = await request.json() as any;
            const query = `
                INSERT INTO landing_page (redirectKey, profileImageUrl, title, subtitle, buttons, buttonColor, faviconUrl, pageTitle)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            `;
            const dbResult = await env?.l1nker_db?.prepare(query)
                .bind(
                    newItem.redirectKey,
                    newItem.profileImageUrl,
                    newItem.title,
                    newItem.subtitle,
                    JSON.stringify(newItem.buttons),
                    newItem.buttonColor,
                    newItem.faviconUrl,
                    newItem.pageTitle,
                )
                .run();
            if (!dbResult) {
                return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return new Response(JSON.stringify({ message: 'Successfully created' }), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        const id = pathname.split('/').pop() || ''; // 从URL中获取id
        if (request.method === 'PUT') {
            const updatedItem = await request.json() as any;
            const updateRedirectKeyPath = pathname.includes("update-redirect-key"); // 检查是否是更新 redirectKey 的请求
            if (updateRedirectKeyPath) {
                  if (!updatedItem.newRedirectKey) {
                      return new Response(JSON.stringify({ message: 'New redirectKey is required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                  const existingItem = await env?.l1nker_db?.prepare('SELECT * FROM landing_page WHERE id = ?').bind(id).first();
                     if (!existingItem){
                       return new Response(JSON.stringify({message: `No item found with id: ${id}`}), {
                             status: 404,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }

                  const existWithNewKey = await env?.l1nker_db?.prepare('SELECT * FROM landing_page WHERE redirectKey = ?').bind(updatedItem.newRedirectKey).first();
                     if (existWithNewKey){
                       return new Response(JSON.stringify({message: `redirectKey already exists: ${updatedItem.newRedirectKey}`}), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                       })
                    }
                     const dbResult = await env?.l1nker_db?.prepare(
                          `UPDATE landing_page SET redirectKey = ? WHERE id = ?`
                      ).bind(updatedItem.newRedirectKey, id).run()
                       if(!dbResult) {
                           return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                                status: 500,
                                headers: { 'Content-Type': 'application/json' },
                            });
                       }
                    return new Response(JSON.stringify({ message: 'Successfully updated' }), {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
            }


             //确保只有管理员或者有权限的用户才能更新
            const existingItem = await env?.l1nker_db?.prepare('SELECT * FROM landing_page WHERE id = ?').bind(id).first();
            if(!existingItem){
                return new Response(JSON.stringify({message: `No item found with id: ${id}`}), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
             if (
                 (request as AuthorizedRequest).managedProjects !== '*' &&
                 !((request as AuthorizedRequest).managedProjects as Array<{ redirectKey: string }>).some((item) => item.redirectKey === existingItem.redirectKey)
             ) {
                 return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                     status: 403,
                     headers: { 'Content-Type': 'application/json' },
                 });
             }

            const query = `
                UPDATE landing_page
                SET profileImageUrl = ?,
                    title = ?,
                    subtitle = ?,
                    buttons = ?,
                    buttonColor = ?,
                    faviconUrl = ?,
                    pageTitle = ?
                WHERE id = ?;
            `;
            const dbResult = await env?.l1nker_db?.prepare(query)
                .bind(
                    updatedItem.profileImageUrl,
                    updatedItem.title,
                    updatedItem.subtitle,
                    JSON.stringify(updatedItem.buttons),
                    updatedItem.buttonColor,
                    updatedItem.faviconUrl,
                    updatedItem.pageTitle,
                     id,
                )
                .run();
            if (!dbResult) {
                return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return new Response(JSON.stringify({ message: 'Successfully updated' }), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });



        }

        if (request.method === 'DELETE') {
            const existingItem = await env?.l1nker_db?.prepare('SELECT * FROM landing_page WHERE id = ?').bind(id).first();
             if(!existingItem){
                return new Response(JSON.stringify({message: `No item found with id: ${id}`}), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            //确保只有管理员或者有权限的用户才能删除
            if (
                (request as AuthorizedRequest).managedProjects !== '*' &&
                !((request as AuthorizedRequest).managedProjects as Array<{ redirectKey: string }>).some(item => item.redirectKey === existingItem.redirectKey)
            ) {
                return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            const dbResult = await env?.l1nker_db?.prepare(`DELETE FROM landing_page WHERE id = ?;`).bind(id).run();
            if (!dbResult) {
                return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return new Response(JSON.stringify({ message: 'Successfully deleted' }), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function hashPassword(
    password: string,
    env: Env,
    providedSalt?: Uint8Array
): Promise<string> {
    const encoder = new TextEncoder();
    // Use provided salt if available, otherwise generate a new one
    const salt = providedSalt || crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    // 使用 deriveBits 而不是 deriveKey 来导出原始的 PBKDF2 密钥
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        256 // 指定需要的密钥长度
    );
    const hashBuffer = new Uint8Array(derivedBits);
    const hashArray = Array.from(hashBuffer);
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const saltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return `${saltHex}:${hashHex}`;

}

async function verifyPassword(
    passwordAttempt: string,
    storedHash: string,
    env: Env,
): Promise<boolean> {
    const [saltHex, originalHash] = storedHash.split(":");
    if (!saltHex || !originalHash) {
        return false;
    }
    const salt = saltHex.match(/.{1,2}/g)?.reduce((acc, byte) => {
        acc.push(parseInt(byte, 16));
        return acc;
    }, [] as number[]);
    if (!salt) {
        throw new Error("Invalid salt format");
    }
    const attemptHashWithSalt = await hashPassword(passwordAttempt, env, new Uint8Array(salt));
    const [, attemptHash] = attemptHashWithSalt.split(":");
    return attemptHash === originalHash;
}


interface Env {
    l1nker_db: D1Database;
    JWT_SECRET_KEY: string;
	MY_R2_BUCKET: R2Bucket;
}
