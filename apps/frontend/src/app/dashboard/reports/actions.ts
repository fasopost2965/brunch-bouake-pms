'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function triggerNightAuditAction() {
  try {
    const result = await fetchWithAuth('/reports/night-audit', {
      method: 'POST',
    });
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard');
    return { success: true, message: result.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
