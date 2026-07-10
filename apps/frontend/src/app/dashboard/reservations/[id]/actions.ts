'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function addFolioLineAction(folioId: number, data: any) {
  try {
    const res = await fetchWithAuth(`/folios/${folioId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/reservations/[id]', 'page');
    return { success: true, line: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function closeFolioAction(folioId: number) {
  try {
    const res = await fetchWithAuth(`/folios/${folioId}/close`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    revalidatePath('/dashboard/reservations/[id]', 'page');
    return { success: true, folio: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaxExemptionAction(reservationId: number, data: { taxExempt: boolean, taxExemptReason: string }) {
  try {
    const res = await fetchWithAuth(`/reservations/${reservationId}/tax-exemption`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/reservations/[id]', 'page');
    return { success: true, reservation: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
