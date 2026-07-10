import React from 'react';
import { fetchWithAuth } from '@/lib/api';
import RoomsClient from './RoomsClient';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const metadata = {
  title: 'Chambres — Brunch Bouaké PMS',
};

export default async function RoomsPage() {
  // Fetch rooms from backend settings/rooms endpoint
  let rooms = [];
  let canWrite = false;

  try {
    rooms = await fetchWithAuth('/settings/rooms');
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
  }

  // Check write permission
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      canWrite = perms.includes('settings.rooms.write');
    } catch (e) {
      // Handled
    }
  }

  return (
    <RoomsClient 
      initialRooms={rooms} 
      canWrite={canWrite} 
    />
  );
}
