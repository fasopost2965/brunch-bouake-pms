import React from 'react';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { fetchWithAuth } from '@/lib/api';
import BillingClient from './BillingClient';

export const metadata = {
  title: 'Folios & Facturation — Brunch Bouaké PMS',
};

export default async function BillingPage() {
  let reservations = [];
  let canClose = false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(token, secret);
      const perms = (payload.permissions as string[]) || [];
      canClose = perms.includes('billing.close');
    }

    reservations = await fetchWithAuth('/reservations');
  } catch (error) {
    console.error('Failed to fetch reservations for billing:', error);
  }

  return (
    <BillingClient reservations={reservations} canClose={canClose} />
  );
}
