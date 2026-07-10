'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { Search, Eye, FileSpreadsheet } from 'lucide-react';
import styles from './Billing.module.css';

type Guest = {
  id: number;
  firstName: string;
  lastName: string;
};

type Room = {
  id: number;
  number: string;
};

type FolioLine = {
  id: number;
  amount: number | string;
};

type Payment = {
  id: number;
  amount: number | string;
  status: string;
};

type Folio = {
  id: number;
  type: 'MAIN' | 'ADJUSTMENT';
  status: 'OPEN' | 'CLOSED';
  balanceDue: number | string;
  lines: FolioLine[];
  payments: Payment[];
};

type Reservation = {
  id: number;
  status: string;
  guest: Guest;
  room: Room | null;
  folios: Folio[];
};

export default function BillingClient({ reservations }: { reservations: Reservation[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [balanceFilter, setBalanceFilter] = useState('ALL');

  // Flatten reservations to a list of folios with reservation info
  const allFolios = reservations.flatMap(res => 
    res.folios.map(folio => {
      const totalCharges = folio.lines.reduce((sum, line) => sum + parseFloat(line.amount.toString()), 0);
      const totalPaid = folio.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const balance = parseFloat(folio.balanceDue.toString());

      return {
        ...folio,
        reservationId: res.id,
        guestName: `${res.guest.firstName} ${res.guest.lastName}`,
        roomNumber: res.room?.number || 'Non assignée',
        totalCharges,
        totalPaid,
        balance,
      };
    })
  );

  // Filter folios
  const filteredFolios = allFolios.filter(folio => {
    // Search filter
    const matchesSearch = 
      folio.guestName.toLowerCase().includes(search.toLowerCase()) || 
      folio.roomNumber.includes(search) || 
      folio.reservationId.toString().includes(search) ||
      folio.id.toString().includes(search);

    // Status filter
    const matchesStatus = statusFilter === 'ALL' || folio.status === statusFilter;

    // Type filter
    const matchesType = typeFilter === 'ALL' || folio.type === typeFilter;

    // Balance filter
    let matchesBalance = true;
    if (balanceFilter === 'HAS_BALANCE') {
      matchesBalance = folio.balance > 0;
    } else if (balanceFilter === 'SETTLED') {
      matchesBalance = folio.balance === 0;
    } else if (balanceFilter === 'OVERPAID') {
      matchesBalance = folio.balance < 0;
    }

    return matchesSearch && matchesStatus && matchesType && matchesBalance;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Folios & Facturation Globale</h1>
      </div>

      {/* Filters Bar */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }} />
          <input 
            type="text" 
            placeholder="Rechercher par client, chambre ou ID..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.filterSelect}>
          <option value="ALL">Tous les statuts de folio</option>
          <option value="OPEN">Ouvert (OPEN)</option>
          <option value="CLOSED">Clôturé (CLOSED)</option>
        </select>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={styles.filterSelect}>
          <option value="ALL">Tous les types</option>
          <option value="MAIN">Folio Principal</option>
          <option value="ADJUSTMENT">Folio d'Ajustement</option>
        </select>

        <select value={balanceFilter} onChange={e => setBalanceFilter(e.target.value)} className={styles.filterSelect}>
          <option value="ALL">Tous les soldes</option>
          <option value="HAS_BALANCE">Solde Débiteur (&gt; 0)</option>
          <option value="SETTLED">Solde Équilibré (= 0)</option>
          <option value="OVERPAID">Solde Créditeur (&lt; 0)</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ID Folio</th>
              <th className={styles.th}>Réservation</th>
              <th className={styles.th}>Client</th>
              <th className={styles.th}>Chambre</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Statut</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Total Charges</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Total Payé</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Solde Dû</th>
              <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFolios.map(folio => (
              <tr key={folio.id} className={styles.tr}>
                <td className={styles.td} style={{ fontWeight: 600 }}>#FL-{folio.id}</td>
                <td className={styles.td}>
                  <Link href={`/dashboard/reservations/${folio.reservationId}`} style={{ color: 'var(--color-brand-chocolate)', fontWeight: 600, textDecoration: 'none' }}>
                    #RS-{folio.reservationId}
                  </Link>
                </td>
                <td className={styles.td} style={{ fontWeight: 500 }}>{folio.guestName}</td>
                <td className={`${styles.td} ${styles.roomCell}`}>Ch. {folio.roomNumber}</td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${styles[`type${folio.type}`]}`}>
                    {folio.type === 'MAIN' ? 'Principal' : 'Ajustement'}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${styles[`status${folio.status}`]}`}>
                    {folio.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.amountCell}`}>
                  {folio.totalCharges.toLocaleString('fr-FR')} CFA
                </td>
                <td className={`${styles.td} ${styles.amountCell}`} style={{ color: '#2E7D32' }}>
                  {folio.totalPaid.toLocaleString('fr-FR')} CFA
                </td>
                <td className={`${styles.td} ${styles.balanceCell}`} style={{ 
                  color: folio.balance > 0 ? 'var(--color-status-error)' : folio.balance === 0 ? '#2E7D32' : '#1565C0' 
                }}>
                  {folio.balance.toLocaleString('fr-FR')} CFA
                </td>
                <td className={styles.td} style={{ textAlign: 'center' }}>
                  <Link href={`/dashboard/reservations/${folio.reservationId}`}>
                    <Button variant="tertiary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8125rem' }}>
                      <Eye size={14} />
                      Détails
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}

            {filteredFolios.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  Aucun folio ne correspond aux critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
