import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'tertiary' | 'gold';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className, 
  disabled, 
  ...props 
}: ButtonProps) {
  const rootClass = `${styles.button} ${styles[variant]} ${className || ''}`;

  return (
    <button 
      className={rootClass.trim()} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
