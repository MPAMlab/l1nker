// Cloudflare Workers
addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event));
});


async function handleRequest(event) {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/data')) {
        const key = url.searchParams.get('key') || 'default';
        return handleApiData(key)
    }
      // For all other request, let cloudflare handle it
    return fetch(request)
}

async function handleApiData(key){
    try{
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
        return new Response(JSON.stringify({
            ...data,
            buttons: JSON.parse(data.buttons),
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
