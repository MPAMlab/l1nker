import { Env } from '../types';

export async function handleApiData(key: string, env: Env): Promise<Response> {
  try {
    const query = `
            SELECT
                lp.*,
                ap.artist_name,
                ap.profile_photo_url as artist_profile_photo_url,
                ap.main_profile,
                ap.artist_page_key
            FROM
                landing_page lp
            LEFT JOIN
                artist_profile ap ON lp.artist_profile_id = ap.id
            WHERE
                lp.redirectKey = ?;
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

    const response = {
      profileImageUrl: data.profileImageUrl,
      title: data.title,
      subtitle: data.subtitle,
      buttons: JSON.parse(data.buttons),
      buttonColor: data.buttonColor,
      faviconUrl: data.faviconUrl,
      pageTitle: data.pageTitle,
      show_artist_section: data.show_artist_section,
      artist: data.show_artist_section ? {
        artist_name: data.artist_name,
        profile_photo_url: data.artist_profile_photo_url,
        main_profile: data.main_profile,
        artist_page_key: data.artist_page_key
      } : null
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
