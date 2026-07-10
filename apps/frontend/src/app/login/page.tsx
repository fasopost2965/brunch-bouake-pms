'use client';

import React, { useActionState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { loginAction, LoginState } from '@/lib/auth.actions';
import { Button, Input, Spinner } from '@/components/ui';
import styles from './LoginPage.module.css';

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  return (
    <div className={styles.page}>
      {/* Decorative left panel */}
      <aside className={styles.panel} aria-hidden="true">
        <div className={styles.panelContent}>
          <div className={styles.logo}>
            <Image 
              src="/logo-brunch-bouake.png" 
              alt="Logo Brunch Bouaké" 
              width={160} 
              height={158} 
              priority 
              unoptimized
              style={{ objectFit: 'contain' }}
            />
          </div>
          <blockquote className={styles.tagline}>
            <p>L&apos;hospitalité,</p>
            <p>à la Brunch.</p>
          </blockquote>
          <div className={styles.decorCircle} />
        </div>
      </aside>

      {/* Login form */}
      <main className={styles.formSection}>
        <div className={styles.formContainer}>
          <header className={styles.formHeader}>
            <h1 className={styles.formTitle}>Connexion</h1>
            <p className={styles.formSubtitle}>
              Accédez à votre espace de gestion hôtelière.
            </p>
          </header>

          <form action={formAction} className={styles.form} noValidate>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              label="Adresse e-mail"
              placeholder="prenom.nom@brunchbouake.com"
              autoComplete="email"
              required
              disabled={isPending}
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isPending}
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />

            {state.error && (
              <div className={styles.errorBanner} role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className={styles.submitButton}
            >
              {isPending ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <footer className={styles.formFooter}>
            <p>
              En cas de problème de connexion, contactez votre administrateur système.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
