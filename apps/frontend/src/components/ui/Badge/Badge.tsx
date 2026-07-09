import React from 'react';
import styles from './Badge.module.css';

export type BadgeStatus = 
  | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW'
  | 'VACANT' | 'OCCUPIED'
  | 'CLEAN' | 'INSPECTION' | 'DIRTY'
  | 'OPERATIONAL' | 'MAINTENANCE';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
  label?: string;
}

const statusMapping: Record<BadgeStatus, string> = {
  // Reservations
  PENDING: styles.neutral,
  CONFIRMED: styles.info,
  CHECKED_IN: styles.success,
  CHECKED_OUT: styles.disabled,
  CANCELLED: styles.error,
  NO_SHOW: styles.error,
  
  // Occupancy
  VACANT: styles.neutral,
  OCCUPIED: styles.info,
  
  // Cleanliness
  CLEAN: styles.success,
  INSPECTION: styles.info,
  DIRTY: styles.error,

  // Technical
  OPERATIONAL: styles.success,
  MAINTENANCE: styles.error,
};

export function Badge({ status, label, className, ...props }: BadgeProps) {
  const rootClass = `${styles.badge} ${statusMapping[status] || styles.neutral} ${className || ''}`;

  return (
    <span className={rootClass.trim()} {...props}>
      {label || status.replace('_', ' ')}
    </span>
  );
}
