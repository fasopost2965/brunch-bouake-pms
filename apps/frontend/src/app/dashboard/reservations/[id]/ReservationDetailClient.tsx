'use client';

import React, { useState } from 'react';
import { Button, Badge, Input, Spinner } from '@/components/ui';
import { addFolioLineAction, closeFolioAction, updateTaxExemptionAction } from './actions';
import { useRouter } from 'next/navigation';
import styles from './ReservationDetail.module.css';

export default function ReservationDetailClient({ reservation, permissions }: { reservation: any, permissions: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tax Exemption state
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxExemptReason, setTaxExemptReason] = useState(reservation.taxExemptReason || '');

  // Add Folio Line state
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [newLine, setNewLine] = useState({ description: '', amount: '', type: 'EXTRA' });

  const mainFolio = reservation.folios?.find((f: any) => f.type === 'MAIN');
  const otherFolios = reservation.folios?.filter((f: any) => f.type !== 'MAIN') || [];

  const handleTaxExemption = async () => {
    setLoading(true);
    setError('');
    const res = await updateTaxExemptionAction(reservation.id, { taxExempt: true, taxExemptReason });
    setLoading(false);
    if (res.success) {
      setShowTaxModal(false);
      router.refresh();
    } else {
      setError(res.error || "Erreur lors de l'application de l'exemption.");
    }
  };

  const handleAddFolioLine = async () => {
    if (!mainFolio) return;
    setLoading(true);
    setError('');
    const res = await addFolioLineAction(mainFolio.id, {
      description: newLine.description,
      amount: parseFloat(newLine.amount),
      type: newLine.type
    });
    setLoading(false);
    if (res.success) {
      setShowAddLineModal(false);
      setNewLine({ description: '', amount: '', type: 'EXTRA' });
      router.refresh();
    } else {
      setError(res.error || "Erreur lors de l'ajout de la charge.");
    }
  };

  const handleCloseFolio = async (folioId: number) => {
    setLoading(true);
    setError('');
    const res = await closeFolioAction(folioId);
    setLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error || "Erreur lors de la clôture du folio.");
    }
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('general')}
          className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : styles.tabInactive}`}
        >
          Général
        </button>
        <button 
          onClick={() => setActiveTab('folio')}
          className={`${styles.tab} ${activeTab === 'folio' ? styles.tabActive : styles.tabInactive}`}
        >
          Folio & Facturation
        </button>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        {activeTab === 'general' && (
          <div className={styles.grid}>
            <div>
              <h3 className={styles.sectionTitle}>Informations Séjour</h3>
              <p><strong>Statut:</strong> <Badge variant="reservation" status={reservation.status} /></p>
              <p><strong>Arrivée:</strong> {new Date(reservation.checkInDate).toLocaleDateString()}</p>
              <p><strong>Départ:</strong> {new Date(reservation.checkOutDate).toLocaleDateString()}</p>
              <p><strong>Tarif:</strong> {reservation.agreedRate} CFA</p>
              <p><strong>Exonéré de taxe:</strong> {reservation.taxExempt ? 'Oui' : 'Non'}</p>
            </div>
            <div>
              <h3 className={styles.sectionTitle}>Informations Chambre</h3>
              <p><strong>Numéro:</strong> {reservation.room?.number || 'Non assignée'}</p>
              <p><strong>Type:</strong> {reservation.room?.roomType?.name || 'N/A'}</p>
            </div>
          </div>
        )}

        {activeTab === 'folio' && (
          <div>
            {/* Folio Principal */}
            {mainFolio ? (
              <div className={styles.folioSection}>
                <div className={styles.folioHeader}>
                  <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Folio Principal (Solde: {mainFolio.balance} CFA)</h3>
                  <div className={styles.actions}>
                    <Badge variant="folio" status={mainFolio.status} />
                    {mainFolio.status === 'OPEN' && permissions.canTaxExempt && !reservation.taxExempt && (
                      <Button variant="outline" onClick={() => setShowTaxModal(true)}>Exonération de taxe</Button>
                    )}
                    {mainFolio.status === 'OPEN' && permissions.canBillingWrite && (
                      <Button variant="primary" onClick={() => setShowAddLineModal(true)}>Ajouter Charge</Button>
                    )}
                    {mainFolio.status === 'OPEN' && permissions.canBillingClose && (
                      <Button variant="outline" onClick={() => handleCloseFolio(mainFolio.id)} disabled={loading}>
                        Clôturer Folio
                      </Button>
                    )}
                  </div>
                </div>

                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHead}>
                      <th className={styles.tableHeaderCell}>Date</th>
                      <th className={styles.tableHeaderCell}>Type</th>
                      <th className={styles.tableHeaderCell}>Description</th>
                      <th className={styles.tableHeaderCellRight}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainFolio.lines?.map((line: any) => (
                      <tr key={line.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>{new Date(line.createdAt).toLocaleString()}</td>
                        <td className={styles.tableCell}>{line.type}</td>
                        <td className={styles.tableCell}>{line.description}</td>
                        <td className={line.amount < 0 ? styles.tableCellRightNegative : styles.tableCellRight}>
                          {line.amount} CFA
                        </td>
                      </tr>
                    ))}
                    {(!mainFolio.lines || mainFolio.lines.length === 0) && (
                      <tr>
                        <td colSpan={4} className={styles.emptyRow}>Aucune charge</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucun folio principal trouvé.</p>
            )}

            {/* Autres Folios (ex: Adjustment) */}
            {otherFolios.length > 0 && (
              <div>
                <h3 className={styles.sectionTitle}>Autres Folios</h3>
                {otherFolios.map((f: any) => (
                  <div key={f.id} className={styles.otherFolioCard}>
                    <div className={styles.otherFolioHeader}>
                      <h4 style={{ margin: 0 }}>Folio {f.type} (Solde: {f.balance} CFA)</h4>
                      <Badge variant="folio" status={f.status} />
                    </div>
                    <table className={styles.table}>
                      <tbody>
                        {f.lines?.map((line: any) => (
                          <tr key={line.id} className={styles.tableRow}>
                            <td style={{ padding: '8px' }}>{new Date(line.createdAt).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>{line.type}</td>
                            <td style={{ padding: '8px' }}>{line.description}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }} className={line.amount < 0 ? styles.tableCellRightNegative : ''}>
                              {line.amount} CFA
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
            
            {/* Si le folio est fermé mais qu'on a le droit à l'exemption */}
            {mainFolio && mainFolio.status === 'CLOSED' && permissions.canTaxExempt && !reservation.taxExempt && (
              <div className={styles.forceExemptContainer}>
                <Button variant="outline" onClick={() => setShowTaxModal(true)}>Forcer Exonération de taxe (Créera un folio d'ajustement)</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaxModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Exonération de taxe</h2>
            <p className={styles.modalDescription}>
              Veuillez fournir un motif obligatoire pour l'exonération (ex: diplomate, motif officiel).
            </p>
            <Input 
              label="Motif / Justificatif"
              value={taxExemptReason}
              onChange={(e) => setTaxExemptReason(e.target.value)}
              required
            />
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowTaxModal(false)} disabled={loading}>Annuler</Button>
              <Button variant="primary" onClick={handleTaxExemption} disabled={loading || !taxExemptReason.trim()}>
                {loading ? <Spinner size="sm" /> : 'Appliquer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddLineModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Ajouter une charge</h2>
            <div className={styles.formGroup}>
              <div>
                <label className={styles.label}>Type</label>
                <select 
                  value={newLine.type}
                  onChange={(e) => setNewLine({ ...newLine, type: e.target.value })}
                  className={styles.select}
                >
                  <option value="ROOM_CHARGE">Room Charge</option>
                  <option value="EXTRA">Extra (Restaurant, etc.)</option>
                  <option value="TAX">Taxe</option>
                </select>
              </div>
              <Input 
                label="Description"
                value={newLine.description}
                onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
              />
              <Input 
                label="Montant (CFA)"
                type="number"
                value={newLine.amount}
                onChange={(e) => setNewLine({ ...newLine, amount: e.target.value })}
              />
            </div>
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowAddLineModal(false)} disabled={loading}>Annuler</Button>
              <Button variant="primary" onClick={handleAddFolioLine} disabled={loading || !newLine.description || !newLine.amount}>
                {loading ? <Spinner size="sm" /> : 'Ajouter'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
