'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

import { ActionResponse } from '@brunch/shared-types';

export async function createGuestAction(data: any): Promise<ActionResponse<any>> {
  try {
    const guest = await fetchWithAuth('/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/guests');
    return { success: true, data: guest };
  } catch (error: any) {
    return { success: false, error: error.message || 'Une erreur est survenue', code: error.status || 500 };
  }
}
