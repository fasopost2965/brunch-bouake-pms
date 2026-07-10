import React from 'react';
import { fetchWithAuth } from '@/lib/api';
import MaintenanceClient from './MaintenanceClient';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const metadata = {
  title: 'Maintenance — Brunch Bouaké PMS',
};

export default async function MaintenancePage() {
  let issues = [];
  let rooms = [];
  let users = [];
  let canWrite = false;

  try {
    const [issuesRes, roomsRes, usersRes] = await Promise.all([
      fetchWithAuth('/maintenance/issues'),
      fetchWithAuth('/settings/rooms'),
      fetchWithAuth('/users-roles/users'),
    ]);
    issues = issuesRes;
    rooms = roomsRes;
    users = usersRes;
  } catch (error) {
    console.error('Failed to fetch data for maintenance:', error);
  }

  // Check write permission
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      const perms = (payload.permissions as string[]) || [];
      canWrite = perms.includes('maintenance.write');
    } catch (e) {
      // Handled
    }
  }

  // Filter staff to include maintenance technicians, managers and admins
  const staff = users.filter((u: any) => 
    u.role.name === 'Maintenance' || 
    u.role.name === 'Manager' || 
    u.role.name === 'Admin'
  );

  return (
    <MaintenanceClient 
      initialIssues={issues} 
      rooms={rooms}
      staff={staff}
      canWrite={canWrite} 
    />
  );
}
