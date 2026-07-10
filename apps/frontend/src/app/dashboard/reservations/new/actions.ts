'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function createReservationAction(data: any) {
  try {
    const res = await fetchWithAuth('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/reservations');
    return { success: true, reservation: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
