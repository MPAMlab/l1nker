import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';

const secretKey = new TextEncoder().encode(
    'cc0b812112d219452473e28499862a93e047616149a171d8266509f8a055163f',
);

addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/data')) {
        const key = url.searchParams.get('key') || 'default';
        return handleApiData(key);
    }
    if (pathname === '/api/register' && request.method === 'POST') {
        return handleRegister(request);
    }
    if (pathname === '/api/login' && request.method === 'POST') {
        return handleLogin(request);
    }
    if (pathname.startsWith('/api/admin/data')) {
        return handleAdminData(request, pathname);
    }
    return fetch(request);
}

async function handleApiData(key) {
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
        const { results } = await L1NKER_DB.prepare(query).bind(key).all();
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
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}


async function handleRegister(request) {
    try {
        const { username, password } = await request.json();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = `
            INSERT INTO l1nker_user (username, password)
            VALUES (?, ?);
        `;
        await L1NKER_DB.prepare(query).bind(username, hashedPassword).run();
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

async function handleLogin(request) {
    try {
        const { username, password } = await request.json();
        const query = `SELECT id, username, password, managed_projects FROM l1nker_user WHERE username = ?`;
        const { results } = await L1NKER_DB.prepare(query).bind(username).all();
        if (results.length === 0) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
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
            exp: Math.floor(Date.now() / 1000) + 60 * 60, // 过期时间：1小时
        };
        const token = await new SignJWT(jwtPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secretKey);

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

async function handleAdminData(request, pathname) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const token = authHeader.substring(7);
    try {
        const { payload } = await jwtVerify(token, secretKey);
        const { managedProjects, userId, username } = payload;
        if (managedProjects !== '*') {
          // 查询用户可以管理的项目列表
            const query = `SELECT * FROM landing_page WHERE redirectKey IN (${managedProjects.split(',').map(key => `'${key}'`).join(',')})`;
             const { results } = await L1NKER_DB.prepare(query).all()
            if (!results || results.length === 0) {
              return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                  status: 403,
                  headers: { 'Content-Type': 'application/json' },
              });
            }
            request.managedProjects = results;
        } else {
             request.managedProjects = '*';
        }
        request.userId = userId;
        request.username = username;

    } catch (error) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    try {
        if (request.method === 'GET') {
            let query;
            if (request.managedProjects === '*') {
                query = `SELECT * FROM landing_page`;
            } else {
                query = `SELECT * FROM landing_page WHERE redirectKey IN (${request.managedProjects.map(item => `'${item.redirectKey}'`).join(',')})`;
            }
            const { results } = await L1NKER_DB.prepare(query).all();
            return new Response(JSON.stringify(results), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        if (request.method === 'POST') {
            const newItem = await request.json();
            const query = `
                INSERT INTO landing_page (redirectKey, profileImageUrl, title, subtitle, buttons, buttonColor, faviconUrl, pageTitle)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            `;
            await L1NKER_DB.prepare(query)
                .bind(newItem.redirectKey, newItem.profileImageUrl, newItem.title, newItem.subtitle, JSON.stringify(newItem.buttons), newItem.buttonColor, newItem.faviconUrl, newItem.pageTitle)
                .run();
            return new Response(JSON.stringify({ message: 'Successfully created' }), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        const redirectKey = pathname.split('/').pop();
        if (request.method === 'PUT') {
             const updatedItem = await request.json()
            //确保只有管理员或者有权限的用户才能更新
            if(request.managedProjects !== '*' && !request.managedProjects.some(item => item.redirectKey === redirectKey)){
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
            await L1NKER_DB.prepare(query)
              .bind(updatedItem.profileImageUrl, updatedItem.title, updatedItem.subtitle, JSON.stringify(updatedItem.buttons), updatedItem.buttonColor, updatedItem.faviconUrl, updatedItem.pageTitle, redirectKey)
             .run()
            return new Response(JSON.stringify({ message: 'Successfully updated' }), {
                headers: {
                  'Content-Type': 'application/json',
                },
            });
        }

        if (request.method === 'DELETE') {
          //确保只有管理员或者有权限的用户才能删除
            if(request.managedProjects !== '*' && !request.managedProjects.some(item => item.redirectKey === redirectKey)){
                return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                    status: 403,
                   headers: { 'Content-Type': 'application/json' },
               });
            }
            const query = `DELETE FROM landing_page WHERE redirectKey = ?;`;
            await L1NKER_DB.prepare(query).bind(redirectKey).run();
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
