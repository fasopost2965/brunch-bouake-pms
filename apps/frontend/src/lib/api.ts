import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logoutAction } from './auth.actions';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    // If no access token, let the client side TokenRefresher handle it if refresh token exists,
    // otherwise redirect to login.
    const refreshToken = cookieStore.get('refresh_token')?.value;
    if (!refreshToken) {
      redirect('/login');
    }
    // Return empty/null data while TokenRefresher does its job
    throw new Error('AUTH_REFRESH_NEEDED');
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    // Prevent caching for real-time dashboard data
    cache: 'no-store',
  });

  if (res.status === 401) {
    // Token might be expired, TokenRefresher will kick in on client side, 
    // but if it's persistent we should redirect.
    throw new Error('AUTH_REFRESH_NEEDED');
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}
