// ============================================
// @brunch/shared-types — Entry point
// ============================================
// Types partagés entre le backend NestJS et le frontend Next.js
// Les types métier seront ajoutés après validation du scaffolding

// ── Statuts de chambre (3 axes indépendants) ──
export type OccupancyStatus = 'vacant' | 'occupied' | 'due_out' | 'due_in';
export type CleanlinessStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_order';
export type MaintenanceStatus = 'ok' | 'maintenance_needed' | 'under_maintenance';

export interface RoomStatus {
  occupancy: OccupancyStatus;
  cleanliness: CleanlinessStatus;
  maintenance: MaintenanceStatus;
}

// ── Réservation ────────────────────────────────
export type ReservationStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

// ── Folio ──────────────────────────────────────
export type FolioStatus = 'open' | 'closed';

// ── API Response wrapper ───────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── User roles ─────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'receptionist' | 'housekeeper';
