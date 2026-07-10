import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { TokenRefresher } from '@/components/auth/TokenRefresher';
import { logoutAction } from '@/lib/auth.actions';
import { Button } from '@/components/ui';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BedDouble, 
  Users, 
  Receipt, 
  Wrench, 
  Sparkles,
  PieChart
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

import * as jose from 'jose';

export const metadata = {
  title: 'Dashboard — Brunch Bouaké PMS',
};

// Navigation items definition based on required permissions
const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiredPerms: [] }, // Everyone who can login can see dashboard
  { href: '/reservations', label: 'Réservations', icon: CalendarDays, requiredPerms: ['reservations.read'] },
  { href: '/rooms', label: 'Chambres', icon: BedDouble, requiredPerms: ['settings.rooms.read'] },
  { href: '/housekeeping', label: 'Housekeeping', icon: Sparkles, requiredPerms: ['housekeeping.read'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, requiredPerms: ['maintenance.read'] },
  { href: '/guests', label: 'Clients', icon: Users, requiredPerms: ['guests.read'] },
  { href: '/billing', label: 'Folios & Facturation', icon: Receipt, requiredPerms: ['billing.read'] },
  { href: '/reports', label: 'Rapports', icon: PieChart, requiredPerms: ['reports.read'] },
];

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

  // Filter navigation items based on user permissions
  const navItems = ALL_NAV_ITEMS.filter(item => 
    item.requiredPerms.length === 0 || item.requiredPerms.some(p => userPerms.includes(p))
  );

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
            <nav className={styles.nav}>
              {navItems.map((item) => {
                const Icon = item.icon;
                // Since this is a server component, we just check if it's the exact path for active state.
                // For a more dynamic active state, we'd need a client component for the navigation.
                // We'll keep it simple here.
                const isActive = item.href === '/dashboard'; // Hardcoded for now since we are in layout
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
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
