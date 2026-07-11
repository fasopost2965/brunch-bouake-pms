import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  variant?: 'reservation' | 'folio' | 'housekeeping' | 'maintenance' | 'room';
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
const domainMapping: Record<string, Record<string, string>> = {
  reservation: {
    PENDING: styles.neutral,
    CONFIRMED: styles.info,
    CHECKED_IN: styles.success,
    CHECKED_OUT: styles.disabled,
    CANCELLED: styles.error,
    NO_SHOW: styles.warning,
  },
  room: {
    VACANT: styles.neutral,
    OCCUPIED: styles.info,
  },
  housekeeping: {
    CLEAN: styles.success,
    INSPECTION: styles.info,
    DIRTY: styles.warning,
  },
  maintenance: {
    OPERATIONAL: styles.success,
    MAINTENANCE: styles.error,
  },
  folio: {
    OPEN: styles.success,
    CLOSED: styles.neutral,
    MAIN: styles.info,
    ADJUSTMENT: styles.warning,
    NEUTRAL: styles.neutral,
  }
};

export function Badge({ status, variant = 'reservation', label, className, ...props }: BadgeProps) {
  // Fallback to flat lookup if variant is wrong, but ideally it should hit the nested dictionary
  const domainDict = domainMapping[variant] || domainMapping.reservation;
  const colorClass = domainDict[status] || styles.neutral;
  
  const rootClass = `${styles.badge} ${colorClass} ${className || ''}`;

  return (
    <span className={rootClass.trim()} {...props}>
      {label || status.replace('_', ' ')}
    </span>
  );
}
