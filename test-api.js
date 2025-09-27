const testAdminUsers = async () => {
  // First, let's get a valid token by logging in
  const loginResponse = await fetch('https://sp.srt.pub/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'fds',
      password: 'fds20020723',
    }),
  });

  console.log('Login response:', loginResponse.status);
  const loginData = await loginResponse.json();
  console.log('Login data:', loginData);

  if (loginData.token) {
    // Now test the admin/users endpoint
    const usersResponse = await fetch('https://sp.srt.pub/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
      },
    });

    console.log('Users response status:', usersResponse.status);
    const usersData = await usersResponse.json();
    console.log('Users data:', usersData);
  }
};

testAdminUsers().catch(console.error);