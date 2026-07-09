import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gold';
  label?: string;
}

export function Spinner({ size = 'md', color = 'primary', label = 'Chargement…' }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${styles[size]} ${styles[color]}`}
      role="status"
      aria-label={label}
    >
      <span className={styles.visuallyHidden}>{label}</span>
    </span>
  );
}
