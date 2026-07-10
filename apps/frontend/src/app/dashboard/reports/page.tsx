import React from 'react';
import { fetchWithAuth } from '@/lib/api';
import ReportsClient from './ReportsClient';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const metadata = {
  title: 'Rapports — Brunch Bouaké PMS',
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  let date = resolvedSearchParams.date;

  if (!date) {
    // Local time formatted as YYYY-MM-DD
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    date = localToday.toISOString().split('T')[0];
  }

  let snapshot = {
    date: new Date().toISOString(),
    occupiedRooms: 0,
    availableRooms: 0,
    accommodationRevenue: 0,
    adr: 0,
    revPar: 0,
  };
  let canWrite = false;

  try {
    snapshot = await fetchWithAuth(`/reports/snapshot?date=${date}`);
  } catch (error) {
    console.error('Failed to fetch daily snapshot:', error);
  }

  // Check write permission for Night Audit
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      canWrite = perms.includes('reports.write');
    } catch (e) {
      // Handled
    }
  }

  return (
    <ReportsClient 
      initialSnapshot={snapshot} 
      selectedDate={date} 
      canWrite={canWrite} 
    />
  );
}
