// Test script to verify the edit page API is working
const testEditPage = async () => {
  try {
    // First login
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

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    console.log('Login successful');

    // Test getting landing pages list
    const listResponse = await fetch('https://sp.srt.pub/api/admin/data', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
      },
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('Landing pages:', JSON.stringify(listData, null, 2));
    } else {
      console.error('Failed to load landing pages:', listResponse.status);
    }

    // Test getting a landing page
    const pageResponse = await fetch('https://sp.srt.pub/api/admin/data/10', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
      },
    });

    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      console.log('Page data loaded successfully:', JSON.stringify(pageData, null, 2));
    } else {
      console.error('Failed to load page data:', pageResponse.status);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testEditPage();