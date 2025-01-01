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
    if (pathname === '/api/login' && request.method === 'POST') {
       return handleLogin(request)
    }

     if (pathname.startsWith('/api/admin/data')) {
          return handleAdminData(request, pathname);
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
async function handleLogin(request) {
  try {
       const { username, password } = await request.json();
    // NOT for PRODUCTION USE!
      if (username === 'admin' && password === 'password') {
          const token = generateToken();
            return new Response(JSON.stringify({ token }), {
             headers: { 'Content-Type': 'application/json' },
         });
      } else {
           return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
               status: 401,
                headers: { 'Content-Type': 'application/json' },
          });
       }
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
    // NOT for PRODUCTION USE!
  if(!isValidToken(token)){
     return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
         headers: { 'Content-Type': 'application/json' },
      });
  }

 try {
    if(request.method === 'GET'){
         const query = `SELECT * FROM landing_page;`
        const { results } = await L1NKER_DB.prepare(query).all()
          return new Response(JSON.stringify(results), {
            headers: {
             'Content-Type': 'application/json',
           }
         });
   }

   if(request.method === 'POST') {
      const newItem = await request.json();
     const query = `
         INSERT INTO landing_page (redirectKey, profileImageUrl, title, subtitle, buttons, buttonColor, faviconUrl, pageTitle)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
         await L1NKER_DB.prepare(query)
         .bind(newItem.redirectKey, newItem.profileImageUrl, newItem.title, newItem.subtitle, JSON.stringify(newItem.buttons), newItem.buttonColor, newItem.faviconUrl, newItem.pageTitle)
        .run();
       return new Response(JSON.stringify({message: 'Successfully created'}), {
           headers: {
             'Content-Type': 'application/json',
            }
         });

   }
    const redirectKey = pathname.split('/').pop();
   if (request.method === 'PUT') {
       const updatedItem = await request.json()
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
        return new Response(JSON.stringify({message: 'Successfully updated'}), {
            headers: {
               'Content-Type': 'application/json',
           }
       })
   }

    if(request.method === 'DELETE'){
       const query = `DELETE FROM landing_page WHERE redirectKey = ?;`;
       await L1NKER_DB.prepare(query).bind(redirectKey).run();
       return new Response(JSON.stringify({message: 'Successfully deleted'}), {
          headers: {
             'Content-Type': 'application/json',
            }
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

function generateToken() {
    // NOT for PRODUCTION USE!
    return Math.random().toString(36).substring(2);
}

 function isValidToken(token) {
    // NOT for PRODUCTION USE!
   return !!token;
 }
