import React from 'react';
import styles from './Badge.module.css';

export type BadgeStatus = 
  | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW'
  | 'VACANT' | 'OCCUPIED'
  | 'CLEAN' | 'INSPECTION' | 'DIRTY'
  | 'OPERATIONAL' | 'MAINTENANCE'
  | 'OPEN' | 'CLOSED' | 'MAIN' | 'ADJUSTMENT' | 'NEUTRAL';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
  label?: string;
}

/*
 * Mapping statut → variante couleur (source de vérité, décision étape 1)
 *
 * RÉSERVATION
 *   PENDING      → neutral  (gris chaleureux)   : en attente, neutre
 *   CONFIRMED    → info     (bleu-gris)          : confirmé mais pas arrivé
 *   CHECKED_IN   → success  (vert brique)        : client présent = actif
 *   CHECKED_OUT  → disabled (transparent+border) : clôturé, neutre
 *   CANCELLED    → error    (rouge #B23A2E)      : annulation = bloquant / définitif
 *   NO_SHOW      → warning  (ambre #9A6B1A)      : non-présentation = à traiter, diff. de CANCELLED
 *
 * CHAMBRE
 *   VACANT       → neutral  : chambre libre, neutre
 *   OCCUPIED     → info     : occupée = informatif
 *
 * HOUSEKEEPING
 *   CLEAN        → success  : prête = positif
 *   INSPECTION   → info     : à vérifier = neutre-actif
 *   DIRTY        → warning  (ambre #9A6B1A)      : à nettoyer = à traiter, pas une erreur système
 *
 * TECHNIQUE
 *   OPERATIONAL  → success  : opérationnel
 *   MAINTENANCE  → error    : panne / hors service = bloquant
 */
const statusMapping: Record<BadgeStatus, string> = {
  // Réservations
  PENDING: styles.neutral,
  CONFIRMED: styles.info,
  CHECKED_IN: styles.success,
  CHECKED_OUT: styles.disabled,
  CANCELLED: styles.error,
  NO_SHOW: styles.warning,    // ambre — distinct de CANCELLED (rouge)

  // Occupation
  VACANT: styles.neutral,
  OCCUPIED: styles.info,

  // Housekeeping
  CLEAN: styles.success,
  INSPECTION: styles.info,
  DIRTY: styles.warning,      // ambre — à traiter, pas une erreur système

  // Technique
  OPERATIONAL: styles.success,
  MAINTENANCE: styles.error,

  // Folios
  OPEN: styles.success,
  CLOSED: styles.neutral,
  MAIN: styles.info,
  ADJUSTMENT: styles.warning,
  NEUTRAL: styles.neutral,
};

export function Badge({ status, label, className, ...props }: BadgeProps) {
  const rootClass = `${styles.badge} ${statusMapping[status] || styles.neutral} ${className || ''}`;

  return (
    <span className={rootClass.trim()} {...props}>
      {label || status.replace('_', ' ')}
    </span>
  );
}
