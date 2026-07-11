'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function addFolioLineAction(folioId: number, data: any) {
  try {
    const res = await fetchWithAuth(`/billing/folios/${folioId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/billing');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur lors de l'ajout de la charge" };
  }
}

export async function addPaymentAction(folioId: number, data: any) {
  try {
    const res = await fetchWithAuth(`/billing/folios/${folioId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/billing');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur lors de l'ajout du paiement" };
  }
}

export async function closeFolioAction(folioId: number, data: { override?: boolean, overrideReason?: string } = {}) {
  try {
    const res = await fetchWithAuth(`/billing/folios/${folioId}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/billing');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de la clôture du folio' };
  }
}

export async function createAdjustmentFolioAction(reservationId: number, justification: string) {
  try {
    const res = await fetchWithAuth(`/billing/adjustments`, {
      method: 'POST',
      body: JSON.stringify({ reservationId, justification }),
    });
    revalidatePath('/dashboard/billing');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur lors de la création du folio d'ajustement" };
  }
}
