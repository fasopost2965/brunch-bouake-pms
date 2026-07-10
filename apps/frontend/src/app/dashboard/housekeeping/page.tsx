import React from 'react';
import { fetchWithAuth } from '@/lib/api';
import HousekeepingClient from './HousekeepingClient';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const metadata = {
  title: 'Ménage & Housekeeping — Brunch Bouaké PMS',
};

export default async function HousekeepingPage() {
  let tasks = [];
  let rooms = [];
  let users = [];
  let canWrite = false;

  try {
    // Parallel fetching
    const [tasksRes, roomsRes, usersRes] = await Promise.all([
      fetchWithAuth('/housekeeping/tasks'),
      fetchWithAuth('/settings/rooms'),
      fetchWithAuth('/users-roles/users'),
    ]);
    tasks = tasksRes;
    rooms = roomsRes;
    users = usersRes;
  } catch (error) {
    console.error('Failed to fetch data for housekeeping:', error);
  }

  // Check write permission
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      canWrite = perms.includes('housekeeping.write');
    } catch (e) {
      // Handled
    }
  }

  // Filter staff to include managers, receptionists, and housekeeping roles
  const staff = users.filter((u: any) => 
    u.role.name === 'Housekeeping' || 
    u.role.name === 'Receptionniste' || 
    u.role.name === 'Manager' || 
    u.role.name === 'Admin'
  );

  return (
    <HousekeepingClient 
      initialTasks={tasks} 
      rooms={rooms}
      staff={staff}
      canWrite={canWrite} 
    />
  );
}
