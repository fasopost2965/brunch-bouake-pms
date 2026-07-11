import React from 'react';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { fetchWithAuth } from '@/lib/api';
import GuestDetailClient from './GuestDetailClient';
import { redirect } from 'next/navigation';

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const guestId = parseInt(resolvedParams.id, 10);
  
  let canWrite = false;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      
      canWrite = perms.includes('guests.write');
    } catch {
      redirect('/login');
    }
  } else {
    redirect('/login');
  }

  let guest = null;
  try {
    guest = await fetchWithAuth(`/guests/${guestId}`);
  } catch (error) {
    console.error('Error fetching guest details:', error);
    return (
      <div style={{ padding: '24px' }}>
        <h1 style={{ color: 'var(--color-status-error)' }}>Client introuvable</h1>
        <p>Le client demandé n'existe pas ou vous n'avez pas l'autorisation de le voir.</p>
      </div>
    );
  }

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-brand-chocolate)', margin: 0 }}>
          Détail du client: {guest.firstName} {guest.lastName}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Gérez les informations, les documents et consultez l'historique du client.
        </p>
      </header>

      <GuestDetailClient guest={guest} canWrite={canWrite} />
    </div>
  );
}
