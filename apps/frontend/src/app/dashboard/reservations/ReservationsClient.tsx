'use client';

import React, { useState } from 'react';
import { Badge, Button, Input, Spinner } from '@/components/ui';
import Link from 'next/link';
import { updateReservationStatusAction } from './actions';
import styles from './Reservations.module.css';

type Reservation = {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
  checkInDate: string;
  checkOutDate: string;
  room?: { number: string };
  guest: { firstName: string; lastName: string };
};

export default function ReservationsClient({ 
  initialReservations, 
  canCheckin = false,
  canCheckout = false,
  canCreate = false
}: { 
  initialReservations: Reservation[], 
  canCheckin?: boolean,
  canCheckout?: boolean,
  canCreate?: boolean
}) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [overrideModal, setOverrideModal] = useState<{ isOpen: boolean, reservationId: number | null, errorMsg: string }>({
    isOpen: false,
    reservationId: null,
    errorMsg: ''
  });
  
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const handleCheckIn = async (id: number) => {
    setLoadingId(id);
    const res = await updateReservationStatusAction(id, 'CHECKED_IN');
    setLoadingId(null);

    if (!res.success) {
      // If backend rejects (e.g. room dirty/maintenance), show override modal
      setOverrideModal({
        isOpen: true,
        reservationId: id,
        errorMsg: res.error || 'Impossible d\'effectuer le check-in.'
      });
      setOverrideReason('');
      setOverrideConfirmed(false);
    }
  };

  const submitOverride = async () => {
    if (!overrideModal.reservationId) return;
    if (overrideConfirmed && !overrideReason.trim()) return;

    setLoadingId(overrideModal.reservationId);
    const res = await updateReservationStatusAction(
      overrideModal.reservationId, 
      'CHECKED_IN',
      { overrideRoomStatus: overrideConfirmed, overrideReason }
    );
    
    setLoadingId(null);
    if (res.success) {
      setOverrideModal({ isOpen: false, reservationId: null, errorMsg: '' });
    } else {
      setOverrideModal(prev => ({ ...prev, errorMsg: res.error || 'Erreur inattendue' }));
    }
  };

  return (
    <div className={styles.container}>
      {canCreate && (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/dashboard/reservations/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Nouvelle Réservation</Button>
          </Link>
        </div>
      )}
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Chambre</th>
              <th>Arrivée</th>
              <th>Départ</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialReservations.map((res) => (
              <tr key={res.id}>
                <td>
                  <div className={styles.guestName}>{res.guest.firstName} {res.guest.lastName}</div>
                </td>
                <td>{res.room?.number || 'Non assignée'}</td>
                <td>{new Date(res.checkInDate).toLocaleDateString('fr-FR')}</td>
                <td>{new Date(res.checkOutDate).toLocaleDateString('fr-FR')}</td>
                <td><Badge status={res.status} /></td>
                <td>
                  <div className={styles.actions}>
                    {/* Action buttons only visible with specific permissions */}
                    {canCheckin && res.status === 'CONFIRMED' && (
                      <Button 
                        variant="primary" 
                        onClick={() => handleCheckIn(res.id)}
                        disabled={loadingId === res.id}
                      >
                        {loadingId === res.id ? <Spinner size="sm" /> : 'Check-in'}
                      </Button>
                    )}
                    {canCheckout && res.status === 'CHECKED_IN' && (
                      <Button 
                        variant="outline"
                        onClick={() => updateReservationStatusAction(res.id, 'CHECKED_OUT')}
                        disabled={loadingId === res.id}
                      >
                        Check-out
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {initialReservations.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
                  Aucune réservation trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Override Modal */}
      {overrideModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Check-in bloqué</h2>
              <p className={styles.modalDesc}>{overrideModal.errorMsg}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={overrideConfirmed} 
                  onChange={(e) => setOverrideConfirmed(e.target.checked)} 
                />
                Forcer le check-in (Override)
              </label>
            </div>

            {overrideConfirmed && (
              <div className={styles.formGroup}>
                <Input 
                  label="Justification obligatoire"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Ex: Demande expresse du manager..."
                  required
                />
              </div>
            )}

            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setOverrideModal({ isOpen: false, reservationId: null, errorMsg: '' })}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={submitOverride}
                disabled={overrideConfirmed && !overrideReason.trim()}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
