import React from 'react';
import { fetchWithAuth } from '@/lib/api';
import GuestsClient from './GuestsClient';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export default async function GuestsPage() {
  let guests = [];
  let canWrite = false;

  try {
    guests = await fetchWithAuth('/guests');
  } catch (error) {
    console.error('Error fetching guests:', error);
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      canWrite = perms.includes('guests.write');
    } catch { /* ignore */ }
  }

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-brand-chocolate)', margin: 0 }}>Clients</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Gérez votre base de données clients.</p>
      </header>

      <GuestsClient initialGuests={guests} canWrite={canWrite} />
    </div>
  );
}
