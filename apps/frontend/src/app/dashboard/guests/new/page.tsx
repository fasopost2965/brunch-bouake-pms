import React from 'react';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import GuestFormClient from './GuestFormClient';
import { redirect } from 'next/navigation';

export default async function NewGuestPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      if (!perms.includes('guests.write')) {
        redirect('/dashboard/guests'); // Unauthorized users sent back to list
      }
    } catch {
      redirect('/login');
    }
  } else {
    redirect('/login');
  }

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-brand-chocolate)', margin: 0 }}>Nouveau Client</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Ajouter une fiche client au CRM.</p>
      </header>

      <GuestFormClient />
    </div>
  );
}
