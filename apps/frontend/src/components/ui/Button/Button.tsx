import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'tertiary' | 'gold';
  size?: 'default' | 'small';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary',
  size = 'default',
  isLoading = false, 
  className, 
  disabled, 
  ...props 
}: ButtonProps) {
  const rootClass = [
    styles.button,
    styles[variant],
    size === 'small' ? styles.small : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={rootClass}
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
