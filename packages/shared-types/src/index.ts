// ============================================
// @brunch/shared-types — Entry point
// ============================================
// Types partagés entre le backend NestJS et le frontend Next.js
// Les types liés à la DB (Enums, Models) doivent être importés de @brunch/database.

// ── API Response wrapper (Backend) ─────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── Server Action Response wrapper (Frontend) ──
export type ActionResponse<T> = 
  | { success: true; data: T; error?: null; code?: null }
  | { success: false; error: string; code: number; data?: null };

