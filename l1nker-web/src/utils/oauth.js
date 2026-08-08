// MPAM IDaaS OAuth client for L1nker (auth.mpam-lab.xyz)
// Stores the access token under localStorage 'authToken' so existing
// components keep working, plus refresh token + expiry.

const AUTH_URL = 'https://auth.mpam-lab.xyz';
const CLIENT_ID = 'l1nker';
const SCOPE = 'admin:read admin:write';

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBytes(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

async function sha256(data) {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

function redirectUri() {
  return `${window.location.origin}/oauth/callback`;
}

export function startLogin() {
  const verifier = b64url(randomBytes(32));
  sha256(new TextEncoder().encode(verifier)).then((hash) => {
    const challenge = b64url(hash);
    const state = b64url(randomBytes(16));
    try {
      sessionStorage.setItem('l1nker.oauth.verifier', verifier);
      sessionStorage.setItem('l1nker.oauth.state', state);
    } catch (e) { /* ignore */ }
    const q = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: redirectUri(),
      scope: SCOPE,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    window.location.assign(`${AUTH_URL}/authorize?${q.toString()}`);
  });
}

export async function handleCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  let expectedState = null;
  let verifier = null;
  try {
    expectedState = sessionStorage.getItem('l1nker.oauth.state');
    verifier = sessionStorage.getItem('l1nker.oauth.verifier');
  } catch (e) { /* ignore */ }
  if (!code || state !== expectedState || !verifier) {
    throw new Error('OAuth state mismatch');
  }

  const res = await fetch(`${AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error || 'Token exchange failed');
  }
  localStorage.setItem('authToken', data.access_token);
  if (data.refresh_token) localStorage.setItem('l1nker.refresh', data.refresh_token);
  localStorage.setItem('l1nker.expires', String(Date.now() + (data.expires_in || 28800) * 1000));
  try {
    sessionStorage.removeItem('l1nker.oauth.state');
    sessionStorage.removeItem('l1nker.oauth.verifier');
  } catch (e) { /* ignore */ }
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('l1nker.refresh');
  localStorage.removeItem('l1nker.expires');
}

export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

// Refresh the access token if it is near expiry. Redirects to /login on failure.
export async function ensureFreshToken() {
  const expires = Number(localStorage.getItem('l1nker.expires') || 0);
  if (Date.now() < expires - 60000) return true;
  const refresh = localStorage.getItem('l1nker.refresh');
  if (!refresh) {
    logout();
    window.location.href = '/login';
    return false;
  }
  try {
    const res = await fetch(`${AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh,
        client_id: CLIENT_ID,
      }),
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('refresh failed');
    localStorage.setItem('authToken', data.access_token);
    if (data.refresh_token) localStorage.setItem('l1nker.refresh', data.refresh_token);
    localStorage.setItem('l1nker.expires', String(Date.now() + (data.expires_in || 28800) * 1000));
    return true;
  } catch (e) {
    logout();
    window.location.href = '/login';
    return false;
  }
}
