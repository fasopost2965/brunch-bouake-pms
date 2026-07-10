import React from 'react';
import { fetchWithAuth } from '@/lib/api';
import BillingClient from './BillingClient';

export const metadata = {
  title: 'Folios & Facturation — Brunch Bouaké PMS',
};

export default async function BillingPage() {
  let reservations = [];

  try {
    reservations = await fetchWithAuth('/reservations');
  } catch (error) {
    console.error('Failed to fetch reservations for billing:', error);
  }

  return (
    <BillingClient reservations={reservations} />
  );
}
