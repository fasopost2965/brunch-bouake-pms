'use server';

import { fetchWithAuth } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceIssueAction(data: {
  roomId: number;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedToId?: number | null;
}) {
  try {
    const issue = await fetchWithAuth('/maintenance/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/maintenance');
    revalidatePath('/dashboard/rooms');
    return { success: true, issue };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMaintenanceIssueAction(issueId: number, data: {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedToId?: number | null;
}) {
  try {
    const issue = await fetchWithAuth(`/maintenance/issues/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/maintenance');
    revalidatePath('/dashboard/rooms');
    return { success: true, issue };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
