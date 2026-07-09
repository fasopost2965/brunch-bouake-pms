import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ children, interactive = false, className, ...props }: CardProps) {
  const rootClass = `${styles.card} ${interactive ? styles.interactive : ''} ${className || ''}`;

  return (
    <div className={rootClass.trim()} {...props}>
      {children}
    </div>
  );
}
