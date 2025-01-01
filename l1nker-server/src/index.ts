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
interface AuthorizedRequest extends Request{
  managedProjects: string |  Array<{ redirectKey: string }>;
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
        const redirectKey = pathname.split('/').pop() || '';
        if (request.method === 'PUT') {
            const updatedItem = await request.json() as any;
            //确保只有管理员或者有权限的用户才能更新
             if (
                (request as AuthorizedRequest).managedProjects !== '*' &&
                !((request as AuthorizedRequest).managedProjects as Array<{redirectKey: string}>).some((item) => item.redirectKey === redirectKey)
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
                WHERE redirectKey = ?;
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
                    redirectKey,
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
            //确保只有管理员或者有权限的用户才能删除
              if ((request as AuthorizedRequest).managedProjects !== '*' &&
              !((request as AuthorizedRequest).managedProjects as Array<{redirectKey: string}>).some(item => item.redirectKey === redirectKey))
              {
                  return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                      status: 403,
                      headers: { 'Content-Type': 'application/json' },
                  });
            }
            const dbResult = await env?.l1nker_db?.prepare(`DELETE FROM landing_page WHERE redirectKey = ?;`).bind(redirectKey).run();
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
    }, [] as number[])
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
}
