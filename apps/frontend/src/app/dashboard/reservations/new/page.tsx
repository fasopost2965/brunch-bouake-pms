import React from 'react';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { redirect } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import ReservationFormClient from './ReservationFormClient';

export default async function NewReservationPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      if (!perms.includes('reservations.create')) {
        redirect('/dashboard/reservations'); // Unauthorized users sent back to list
      }
    } catch {
      redirect('/login');
    }
  } else {
    redirect('/login');
  }

  // Fetch guests and rooms to populate the form
  let guests = [];
  let rooms = [];
  try {
    const [fetchedGuests, fetchedRooms] = await Promise.all([
      fetchWithAuth('/guests'),
      fetchWithAuth('/rooms'),
    ]);
    guests = fetchedGuests;
    rooms = fetchedRooms;
  } catch (error) {
    console.error('Error fetching data for reservation form:', error);
  }

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-brand-chocolate)', margin: 0 }}>Nouvelle Réservation</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Créer une réservation avec vérification de disponibilité.</p>
      </header>

      <ReservationFormClient guests={guests} rooms={rooms} />
    </div>
  );
}
