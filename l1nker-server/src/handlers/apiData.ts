import { Env } from '../types';

export async function handleApiData(key: string, env: Env): Promise<Response> {
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
      return new Response(JSON.stringify({ error: 'l1nker_db binding failed.' }), {
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
