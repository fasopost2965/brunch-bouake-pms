'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

import { ActionResponse } from '@brunch/shared-types';

export async function createHousekeepingTaskAction(data: {
  roomId: number;
  type: 'CHECKOUT_CLEAN' | 'STAYOVER_CLEAN' | 'INSPECTION' | 'DEEP_CLEAN';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedToId?: number | null;
  notes?: string;
}): Promise<ActionResponse<any>> {
  try {
    const task = await fetchWithAuth('/housekeeping/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/housekeeping');
    revalidatePath('/dashboard/rooms');
    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message || 'Une erreur est survenue', code: error.status || 500 };
  }
}

export async function updateHousekeepingTaskAction(taskId: number, data: {
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignedToId?: number | null;
  inspectionResult?: 'CLEAN' | 'DIRTY' | 'INSPECTION' | null;
  notes?: string;
}): Promise<ActionResponse<any>> {
  try {
    const task = await fetchWithAuth(`/housekeeping/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/housekeeping');
    revalidatePath('/dashboard/rooms');
    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message || 'Une erreur est survenue', code: error.status || 500 };
  }
}
