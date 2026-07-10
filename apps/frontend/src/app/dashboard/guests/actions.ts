'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function createGuestAction(data: any) {
  try {
    const guest = await fetchWithAuth('/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/guests');
    return { success: true, guest };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
