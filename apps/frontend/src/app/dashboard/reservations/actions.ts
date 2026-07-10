'use strict';
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api';

export async function updateReservationStatusAction(
  id: number, 
  status: string,
  overrideData?: { overrideRoomStatus: boolean; overrideReason: string }
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return { success: false, error: 'Non authentifié' };
  }

  const endpoint = status === 'CHECKED_IN' ? `/reservations/${id}/checkin` : `/reservations/${id}/checkout`;
  const body = status === 'CHECKED_IN' ? {
    override: overrideData?.overrideRoomStatus || false,
    overrideReason: overrideData?.overrideReason || '',
  } : {};

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    return { 
      success: false, 
      error: errorData.message || 'Une erreur est survenue',
      code: errorData.statusCode
    };
  }

  revalidatePath('/dashboard/reservations');
  revalidatePath('/dashboard');
  return { success: true };
}
