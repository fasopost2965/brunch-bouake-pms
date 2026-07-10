'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { triggerNightAuditAction } from './actions';
import { useRouter } from 'next/navigation';
import { ShieldAlert, BarChart3, Calendar, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import styles from './Reports.module.css';

type DailySnapshot = {
  date: string;
  occupiedRooms: number;
  availableRooms: number;
  accommodationRevenue: number | string;
  adr: number | string;
  revPar: number | string;
};

export default function ReportsClient({
  initialSnapshot,
  selectedDate,
  canWrite,
}: {
  initialSnapshot: DailySnapshot;
  selectedDate: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [date, setDate] = useState(selectedDate);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/dashboard/reports?date=${newDate}`);
  };

  const handleNightAudit = async () => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await triggerNightAuditAction();
    setIsSubmitting(false);
    setShowConfirmModal(false);

    if (result.success) {
      setMessage(result.message || 'L\'Audit de Nuit s\'est déroulé avec succès !');
      // Refresh current page to reload new snapshots
      router.refresh();
    } else {
      setError(result.error || 'Une erreur est survenue lors de l\'Audit de Nuit.');
    }
  };

  const revenue = parseFloat(initialSnapshot.accommodationRevenue.toString());
  const adr = parseFloat(initialSnapshot.adr.toString());
  const revPar = parseFloat(initialSnapshot.revPar.toString());
  
  const occupancyRate = initialSnapshot.availableRooms > 0 
    ? (initialSnapshot.occupiedRooms / initialSnapshot.availableRooms) * 100 
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Rapports & Indicateurs Hôteliers</h1>
        
        <div className={styles.dateSelector}>
          <Calendar size={18} style={{ color: 'var(--color-text-secondary)' }} />
          <span className={styles.dateLabel}>Date d'analyse :</span>
          <input 
            type="date" 
            value={date} 
            onChange={e => handleDateChange(e.target.value)} 
            className={styles.dateInput}
          />
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: '12px', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '12px', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* KPIs Grid */}
      <div className={styles.grid}>
        {/* Occupancy Card */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>Taux d'Occupation</span>
          <div className={styles.cardValue}>{occupancyRate.toFixed(1)}%</div>
          <span className={styles.cardSub}>
            {initialSnapshot.occupiedRooms} chambres occupées / {initialSnapshot.availableRooms} disponibles
          </span>
        </div>

        {/* ADR Card */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>ADR (Tarif Moyen Journalier)</span>
          <div className={styles.cardValue}>{adr.toLocaleString('fr-FR')} CFA</div>
          <span className={styles.cardSub}>Revenu moyen par chambre louée</span>
        </div>

        {/* RevPAR Card */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>RevPAR</span>
          <div className={styles.cardValue}>{revPar.toLocaleString('fr-FR')} CFA</div>
          <span className={styles.cardSub}>Revenu moyen par chambre disponible</span>
        </div>

        {/* Total Revenue Card */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>Revenu Hébergement</span>
          <div className={styles.cardValue}>{revenue.toLocaleString('fr-FR')} CFA</div>
          <span className={styles.cardSub}>Total facturé sur la journée</span>
        </div>
      </div>

      {/* Night Audit Section */}
      {canWrite && (
        <div className={styles.auditSection}>
          <div className={styles.auditTitle}>
            <ShieldAlert size={24} style={{ color: 'var(--color-brand-gold)' }} />
            Audit de Nuit (Night Audit)
          </div>
          
          <p className={styles.auditDesc}>
            L'audit de nuit est une procédure quotidienne irréversible. Elle permet de figer les statistiques de la journée écoulée, d'enregistrer le snapshot financier dans l'historique et de basculer automatiquement les réservations non honorées (`CONFIRMED` non présentées) en `NO_SHOW`.
          </p>

          <div className={styles.warningBox}>
            <span style={{ fontWeight: 700 }}>Avertissements importants :</span>
            <span>- Cette action va figer les données d'hier dans la base de données.</span>
            <span>- Toutes les réservations dont la date de check-in est dépassée sans enregistrement seront marquées comme non présentées (NO_SHOW).</span>
          </div>

          <div className={styles.auditActions}>
            <Button onClick={() => setShowConfirmModal(true)} variant="primary">
              Déclencher le Night Audit
            </Button>
          </div>
        </div>
      )}

      {/* Night Audit Confirm Modal */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} style={{ color: '#E65100' }} />
                Confirmer le Night Audit
              </h2>
              <button type="button" onClick={() => setShowConfirmModal(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
              Êtes-vous sûr de vouloir exécuter l'audit de nuit maintenant ? Les données de la journée d'hier seront définitivement sauvegardées dans l'historique financier et les statuts des réservations expirées seront mis à jour.
            </p>

            <div className={styles.modalActions}>
              <Button type="button" variant="tertiary" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="button" variant="primary" onClick={handleNightAudit} disabled={isSubmitting}>
                {isSubmitting ? 'Exécution...' : 'Confirmer et Lancer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
