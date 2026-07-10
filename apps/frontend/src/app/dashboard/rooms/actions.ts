'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function updateRoomAction(roomId: number, data: {
  cleanlinessStatus?: 'CLEAN' | 'DIRTY' | 'INSPECTION';
  technicalStatus?: 'OPERATIONAL' | 'MAINTENANCE';
  notes?: string;
}) {
  try {
    const room = await fetchWithAuth(`/settings/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/rooms');
    return { success: true, room };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
