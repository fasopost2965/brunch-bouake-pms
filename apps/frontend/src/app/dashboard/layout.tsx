import React from 'react';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { TokenRefresher } from '@/components/auth/TokenRefresher';
import { logoutAction } from '@/lib/auth.actions';
import { Button } from '@/components/ui';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import styles from './DashboardLayout.module.css';

import * as jose from 'jose';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard — Brunch Bouaké PMS',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const hasAccessToken = !!accessToken;
  const userRole = cookieStore.get('user_role')?.value || '';
  const userName = cookieStore.get('user_name')?.value || 'Utilisateur';

  let userPerms: string[] = [];
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      userPerms = (payload.permissions as string[]) || [];
    } catch (e) {
      // Invalid token, handled by middleware/TokenRefresher
    }
  }

  return (
    <>
      <TokenRefresher hasAccessToken={hasAccessToken} />
      {hasAccessToken && (
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <Image 
                src="/logo-brunch-bouake.png" 
                alt="Logo Brunch Bouaké" 
                width={120} 
                height={120} 
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
              />
            </div>
            <SidebarNav userPerms={userPerms} />
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            <header className={styles.header}>
              <div className={styles.userInfo}>
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{userName}</span>
                  <span className={styles.userRole}>{userRole}</span>
                </div>
                <form action={logoutAction}>
                  <Button variant="tertiary" type="submit">Déconnexion</Button>
                </form>
              </div>
            </header>
            <div className={styles.content}>
              {children}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
