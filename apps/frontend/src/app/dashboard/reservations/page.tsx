import React from 'react';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { fetchWithAuth } from '@/lib/api';
import ReservationsClient from './ReservationsClient';

export default async function ReservationsPage() {
  let reservations = [];
  let canCheckin = false;
  let canCheckout = false;
  let canCreate = false;

  try {
    reservations = await fetchWithAuth('/reservations');
  } catch (error) {
    console.error('Error fetching reservations:', error);
  }

  // Extract permissions from verified JWT to control action buttons
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      canCheckin = perms.includes('reservations.checkin');
      canCheckout = perms.includes('reservations.checkout');
      canCreate = perms.includes('reservations.create');
    } catch { /* token invalid, booleans stay false */ }
  }

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-brand-chocolate)', margin: 0 }}>Réservations</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Gérez les arrivées, départs et séjours en cours.</p>
      </header>

      <ReservationsClient 
        initialReservations={reservations} 
        canCheckin={canCheckin} 
        canCheckout={canCheckout} 
        canCreate={canCreate}
      />
    </div>
  );
}
