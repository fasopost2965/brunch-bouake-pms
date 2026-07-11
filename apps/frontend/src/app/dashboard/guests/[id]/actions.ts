'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function updateGuestAction(id: number, data: any) {
  try {
    const res = await fetchWithAuth(`/guests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    revalidatePath(`/dashboard/guests/${id}`);
    revalidatePath('/dashboard/guests');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de la mise à jour du client' };
  }
}

export async function uploadDocumentAction(guestId: number, formData: FormData) {
  try {
    const res = await fetchWithAuth(`/guests/${guestId}/documents`, {
      method: 'POST',
      body: formData // fetchWithAuth will handle FormData correctly if it doesn't set Content-Type to application/json
    });
    revalidatePath(`/dashboard/guests/${guestId}`);
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de l\'upload du document' };
  }
}
