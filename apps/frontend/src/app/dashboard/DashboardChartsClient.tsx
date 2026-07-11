'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import styles from './DashboardPage.module.css';

// Type definitions
type Reservation = {
  id: number;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  room?: { number: string, roomType?: { name: string } };
  agreedRate?: number;
  folios?: any[];
};

export default function DashboardChartsClient({ reservations }: { reservations: Reservation[] }) {
  // 1. Generate 30 days dummy data for occupancy (since we don't have historical daily snapshots seeded fully)
  const generateOccupancyData = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      // Some realistic looking random occupancy rate between 40% and 95%
      // In a real app, this would come from the DailySnapshot table
      const occ = 40 + Math.random() * 55;
      
      data.push({
        name: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        Taux: Math.round(occ),
      });
    }
    return data;
  };
  
  const occupancyData = generateOccupancyData();

  // 2. Derive Revenue by Room Type from reservations (Using agreedRate * nights for simplicity if folios aren't fully populated)
  const revenueByRoomType: Record<string, number> = {
    'Chambre Standard': 0,
    'Studio': 0,
    'Appartement': 0,
    'Non assigné': 0
  };

  reservations.forEach(res => {
    if (res.status === 'CANCELLED' || res.status === 'NO_SHOW') return;
    
    // Estimate revenue
    const checkIn = new Date(res.checkInDate).getTime();
    const checkOut = new Date(res.checkOutDate).getTime();
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24)));
    const revenue = Number(res.agreedRate || 0) * nights;

    const roomType = res.room?.roomType?.name || 'Non assigné';
    
    if (revenueByRoomType[roomType] !== undefined) {
      revenueByRoomType[roomType] += revenue;
    } else {
      revenueByRoomType[roomType] = revenue;
    }
  });

  const revenueData = Object.keys(revenueByRoomType).map(key => ({
    name: key,
    Revenu: revenueByRoomType[key]
  })).filter(d => d.Revenu > 0 || d.name === 'Chambre Standard' || d.name === 'Studio' || d.name === 'Appartement'); // keep base ones even if 0

  const COLORS = ['#8B5A2B', '#D4AF37', '#2E2E2E', '#A9A9A9']; // Chocolate, Gold, Dark, Gray

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
      {/* Occupancy Line Chart */}
      <div className={styles.chartContainer} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-brand-chocolate)', fontSize: '1.125rem' }}>Évolution du Taux d'Occupation (30 jours)</h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={(val) => val + '%'} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--color-brand-chocolate)' }}
              />
              <Line type="monotone" dataKey="Taux" stroke="var(--color-brand-gold)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: 'var(--color-brand-gold)', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Room Type Bar Chart */}
      <div className={styles.chartContainer} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-brand-chocolate)', fontSize: '1.125rem' }}>Répartition des Revenus par Type</h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={(val) => (val / 1000) + 'k'} />
              <Tooltip 
                cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(value) || 0)}
              />
              <Bar dataKey="Revenu" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {revenueData.map((entry, index) => (
                  <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
