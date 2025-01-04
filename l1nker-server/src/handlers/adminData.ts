import { jwtVerify } from 'jose';
import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';

export async function handleAdminData(request: Request, pathname: string, env: Env): Promise<Response> {
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
    const { managedProjects, userId, username } = payload as {
      managedProjects: string;
      userId: number;
      username: string;
    };
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
        return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
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
        return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
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
      const dbResult = await env?.l1nker_db
        ?.prepare(query)
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
        return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
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
      const updateRedirectKeyPath = pathname.includes('update-redirect-key'); // 检查是否是更新 redirectKey 的请求
      if (updateRedirectKeyPath) {
        if (!updatedItem.newRedirectKey) {
          return new Response(JSON.stringify({ message: 'New redirectKey is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const existingItem = await env?.l1nker_db
          ?.prepare('SELECT * FROM landing_page WHERE id = ?')
          .bind(id)
          .first();
        if (!existingItem) {
          return new Response(JSON.stringify({ message: `No item found with id: ${id}` }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const existWithNewKey = await env?.l1nker_db
          ?.prepare('SELECT * FROM landing_page WHERE redirectKey = ?')
          .bind(updatedItem.newRedirectKey)
          .first();
        if (existWithNewKey) {
          return new Response(
            JSON.stringify({ message: `redirectKey already exists: ${updatedItem.newRedirectKey}` }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
        const dbResult = await env?.l1nker_db
          ?.prepare(`UPDATE landing_page SET redirectKey = ? WHERE id = ?`)
          .bind(updatedItem.newRedirectKey, id)
          .run();
        if (!dbResult) {
          return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
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
      const existingItem = await env?.l1nker_db
        ?.prepare('SELECT * FROM landing_page WHERE id = ?')
        .bind(id)
        .first();
      if (!existingItem) {
        return new Response(JSON.stringify({ message: `No item found with id: ${id}` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (
        (request as AuthorizedRequest).managedProjects !== '*' &&
        !((request as AuthorizedRequest).managedProjects as Array<{ redirectKey: string }>).some(
          (item) => item.redirectKey === existingItem.redirectKey,
        )
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
      const dbResult = await env?.l1nker_db
        ?.prepare(query)
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
        return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
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
      const existingItem = await env?.l1nker_db
        ?.prepare('SELECT * FROM landing_page WHERE id = ?')
        .bind(id)
        .first();
      if (!existingItem) {
        return new Response(JSON.stringify({ message: `No item found with id: ${id}` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      //确保只有管理员或者有权限的用户才能删除
      if (
        (request as AuthorizedRequest).managedProjects !== '*' &&
        !((request as AuthorizedRequest).managedProjects as Array<{ redirectKey: string }>).some(
          (item) => item.redirectKey === existingItem.redirectKey,
        )
      ) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const dbResult = await env?.l1nker_db
        ?.prepare(`DELETE FROM landing_page WHERE id = ?;`)
        .bind(id)
        .run();
      if (!dbResult) {
        return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
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

