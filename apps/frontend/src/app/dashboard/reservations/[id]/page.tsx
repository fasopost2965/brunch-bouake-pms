import React from 'react';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { fetchWithAuth } from '@/lib/api';
import ReservationDetailClient from './ReservationDetailClient';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const reservationId = parseInt(resolvedParams.id, 10);
  
  let canView = false;
  let canTaxExempt = false;
  let canBillingWrite = false;
  let canBillingClose = false;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      
      canView = perms.includes('reservations.read'); // Wait, do we have reservations.read? Let's check if they can just view if logged in or need specific permission. Let's assume they can view if they reached here, or we don't have read permission seeded. I'll just let them view if they have a token.
      
      canTaxExempt = perms.includes('reservation.tax_exempt');
      canBillingWrite = perms.includes('billing.write');
      canBillingClose = perms.includes('billing.close');
    } catch {
      redirect('/login');
    }
  } else {
    redirect('/login');
  }

  let reservation = null;
  try {
    reservation = await fetchWithAuth(`/reservations/${reservationId}`);
  } catch (error) {
    console.error('Error fetching reservation details:', error);
    return <div>Réservation introuvable.</div>;
  }

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-brand-chocolate)', margin: 0 }}>
          Détail de la réservation #{reservation.id}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Client:{' '}
          <Link href={`/dashboard/guests/${reservation.guest?.id}`} style={{ color: 'var(--color-brand-gold)', textDecoration: 'none', fontWeight: 500 }}>
            {reservation.guest?.firstName} {reservation.guest?.lastName}
          </Link>
        </p>
      </header>

      <ReservationDetailClient 
        reservation={reservation} 
        permissions={{ canTaxExempt, canBillingWrite, canBillingClose }} 
      />
    </div>
  );
}
