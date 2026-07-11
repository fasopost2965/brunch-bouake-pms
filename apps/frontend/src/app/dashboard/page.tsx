import React from 'react';
import { Card, Badge } from '@/components/ui';
import { fetchWithAuth } from '@/lib/api';
import DashboardChartsClient from './DashboardChartsClient';
import styles from './DashboardPage.module.css';

// Type definitions based on backend
type Room = {
  id: number;
  number: string;
  occupancyStatus: 'VACANT' | 'OCCUPIED';
  cleanlinessStatus: 'CLEAN' | 'INSPECTION' | 'DIRTY';
  technicalStatus: 'OPERATIONAL' | 'MAINTENANCE';
};

type Reservation = {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
  checkInDate: string;
  checkOutDate: string;
  room?: { number: string };
  guest: { firstName: string; lastName: string };
};

export default async function DashboardPage() {
  let occupancy = { occupancyRate: 0 };
  let adrData = { adr: 0 };
  let revparData = { revPar: 0 };
  let reservations: Reservation[] = [];
  let rooms: Room[] = [];

  try {
    // Fetch all required data in parallel
    const [occ, adr, rev, res, rms] = await Promise.all([
      fetchWithAuth('/reports/occupancy'),
      fetchWithAuth('/reports/adr'),
      fetchWithAuth('/reports/revpar'),
      fetchWithAuth('/reservations'),
      fetchWithAuth('/rooms'),
    ]);
    
    occupancy = occ;
    adrData = adr;
    revparData = rev;
    reservations = res;
    rooms = rms;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // If it's AUTH_REFRESH_NEEDED, it will be handled by layout/TokenRefresher
    // Otherwise we show 0/empty
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
  };

  // Filter arrivals and departures for today
  const todayStr = new Date().toISOString().split('T')[0];
  const arrivals = reservations.filter(r => r.checkInDate.startsWith(todayStr) && ['PENDING', 'CONFIRMED'].includes(r.status));
  const departures = reservations.filter(r => r.checkOutDate.startsWith(todayStr) && r.status === 'CHECKED_IN');

  // Calculate room inventory stats
  const totalRooms = rooms.length;
  const vacantRooms = rooms.filter(r => r.occupancyStatus === 'VACANT').length;
  const occupiedRooms = rooms.filter(r => r.occupancyStatus === 'OCCUPIED').length;
  const dirtyVacant = rooms.filter(r => r.occupancyStatus === 'VACANT' && r.cleanlinessStatus === 'DIRTY').length;
  const maintenanceRooms = rooms.filter(r => r.technicalStatus === 'MAINTENANCE').length;

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Front Desk</h1>
        <p className={styles.subtitle}>Aperçu de l&apos;activité de l&apos;établissement aujourd&apos;hui.</p>
      </header>

      {/* KPI Cards */}
      <section className={styles.kpiGrid}>
        <Card>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Taux d&apos;occupation</span>
            <span className={styles.kpiValue}>{Math.round(occupancy.occupancyRate)}%</span>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>ADR (Prix moyen)</span>
            <span className={styles.kpiValue}>{formatCurrency(adrData.adr)}</span>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>RevPAR</span>
            <span className={styles.kpiValue}>{formatCurrency(revparData.revPar)}</span>
          </div>
        </Card>
      </section>

      {/* KPI Charts */}
      <DashboardChartsClient reservations={reservations} />

      {/* Main Content Grid */}
      <div className={styles.sectionGrid}>
        {/* Arrivals & Departures */}
        <div>
          <section style={{ marginBottom: '32px' }}>
            <h2 className={styles.sectionTitle}>Arrivées du jour</h2>
            <Card>
              {arrivals.length > 0 ? (
                <div className={styles.list}>
                  {arrivals.map(arr => (
                    <div key={arr.id} className={styles.listItem}>
                      <div className={styles.listItemMain}>
                        <span className={styles.guestName}>{arr.guest.firstName} {arr.guest.lastName}</span>
                        <span className={styles.roomInfo}>Chambre: {arr.room?.number || 'Non assignée'}</span>
                      </div>
                      <Badge status={arr.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>Aucune arrivée prévue aujourd&apos;hui.</div>
              )}
            </Card>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Départs du jour</h2>
            <Card>
              {departures.length > 0 ? (
                <div className={styles.list}>
                  {departures.map(dep => (
                    <div key={dep.id} className={styles.listItem}>
                      <div className={styles.listItemMain}>
                        <span className={styles.guestName}>{dep.guest.firstName} {dep.guest.lastName}</span>
                        <span className={styles.roomInfo}>Chambre: {dep.room?.number || 'Inconnue'}</span>
                      </div>
                      <Badge status={dep.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>Aucun départ prévu aujourd&apos;hui.</div>
              )}
            </Card>
          </section>
        </div>

        {/* Room Inventory */}
        <div>
          <section>
            <h2 className={styles.sectionTitle}>Inventaire Chambres</h2>
            <Card>
              <div className={styles.inventoryList}>
                <div className={styles.inventoryItem}>
                  <span className={styles.inventoryLabel}>Total</span>
                  <span className={styles.inventoryValue}>{totalRooms} chambres</span>
                </div>
                <div className={styles.inventoryItem}>
                  <span className={styles.inventoryLabel}>Libres</span>
                  <div>
                    <span className={styles.inventoryValue}>{vacantRooms}</span>
                    {dirtyVacant > 0 && <span className={styles.inventoryNote}>(dont {dirtyVacant} sale{dirtyVacant > 1 ? 's' : ''})</span>}
                  </div>
                </div>
                <div className={styles.inventoryItem}>
                  <span className={styles.inventoryLabel}>Occupées</span>
                  <span className={styles.inventoryValue}>{occupiedRooms}</span>
                </div>
                <div className={styles.inventoryItem}>
                  <span className={styles.inventoryLabel}>Maintenance</span>
                  <span className={styles.inventoryValue}>{maintenanceRooms}</span>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
