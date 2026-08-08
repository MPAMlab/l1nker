import { Env } from '../types';
import { AuthorizedRequest } from '../types/authorizedRequest';
import { validatePermissions } from '../utils/permissions';

export async function handleAdminData(request: Request, pathname: string, env: Env): Promise<Response> {
  const authResult = await validatePermissions(request, env);
  if (!authResult.authorized) {
    return authResult.error!;
  }
  const { payload } = authResult;
  const { managedProjects } = payload!;
    (request as AuthorizedRequest).managedProjects = managedProjects;
    (request as AuthorizedRequest).username = payload!.username;
    (request as AuthorizedRequest).userId = payload!.userId;
    (request as AuthorizedRequest).role = payload!.role;
    if (managedProjects !== '*') {
      //查询用户可以管理的项目列�?- 使用参数化查询防止SQL注入
      const projectKeys = managedProjects.split(',').map(key => key.trim()).filter(key => key);
      if (projectKeys.length === 0) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 构建参数化查�?
      const placeholders = projectKeys.map(() => '?').join(',');
      const query = `SELECT * FROM landing_page WHERE redirectKey IN (${placeholders})`;
      const { results } = await env?.l1nker_db?.prepare(query).bind(...projectKeys).all<{ redirectKey: string }>();
      if (!results) {
        return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      //判断是否有权�?
      if (!results || results.length === 0) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      (request as AuthorizedRequest).managedProjects = results;
    }

    // 如果验证通过，则继续处理请求
  // 数据库查询和更新代码
  try {
    if (request.method === 'GET') {
      let query;
      let results: any[] = [];
      if (pathname.includes('/api/admin/data/')) {
        const id = pathname.split('/').pop() || '';
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
        //确保只有管理员或者有权限的用户才能获�?
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
        return new Response(JSON.stringify(existingItem), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      if ((request as AuthorizedRequest).managedProjects === '*') {
        query = `SELECT * FROM landing_page`;
        const { results: allResults } = await env?.l1nker_db?.prepare(query).all<any>();
        if (!allResults) {
          return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        results = allResults;
      } else {
        // 使用参数化查询防止SQL注入
        const managedProjects = (request as AuthorizedRequest).managedProjects as Array<{ redirectKey: string }>;
        const projectKeys = managedProjects.map(item => item.redirectKey);
        if (projectKeys.length > 0) {
          const placeholders = projectKeys.map(() => '?').join(',');
          query = `SELECT * FROM landing_page WHERE redirectKey IN (${placeholders})`;
          const { results: filteredResults } = await env?.l1nker_db?.prepare(query).bind(...projectKeys).all<any>();
          if (!filteredResults) {
            return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          results = filteredResults;
        } else {
          results = [];
        }
      }

      return new Response(JSON.stringify(results), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    if (request.method === 'POST') {
      // Check if user has permission to create landing pages
      const userRole = (request as AuthorizedRequest).role;
      const managedProjects = (request as AuthorizedRequest).managedProjects;

      if (userRole !== 'admin' && managedProjects === '*') {
        return new Response(JSON.stringify({ message: 'Unauthorized: Invalid permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const newItem = await request.json() as any;
      const query = `
                INSERT INTO landing_page (redirectKey, profileImageUrl, title, subtitle, buttons, buttonColor, faviconUrl, pageTitle, show_artist_section, artist_profile_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
      const dbResult = await env?.l1nker_db
        ?.prepare(query)
        .bind(
          newItem.redirectKey,
          newItem.profileImageUrl,
          newItem.title,
          newItem.subtitle,
          newItem.buttons,
          newItem.buttonColor,
          newItem.faviconUrl,
          newItem.pageTitle,
          newItem.show_artist_section || 0,
          newItem.artist_profile_id || null,
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
      const updateRedirectKeyPath = pathname.includes('update-redirect-key'); // 检查是否是更新 redirectKey 的请�?
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

      //确保只有管理员或者有权限的用户才能更�?
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
                    pageTitle = ?,
                    show_artist_section = ?,
                    artist_profile_id = ?
                WHERE id = ?;
            `;
      const dbResult = await env?.l1nker_db
        ?.prepare(query)
        .bind(
          updatedItem.profileImageUrl,
          updatedItem.title,
          updatedItem.subtitle,
          updatedItem.buttons,
          updatedItem.buttonColor,
          updatedItem.faviconUrl,
          updatedItem.pageTitle,
          updatedItem.show_artist_section || 0,
          updatedItem.artist_profile_id || null,
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
      //确保只有管理员或者有权限的用户才能删�?
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
  } catch (error) {
    console.error('Error in adminData:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}