'use client';

import React, { useState } from 'react';
import { Button, Badge, Input, Spinner } from '@/components/ui';
import { addFolioLineAction, closeFolioAction, updateTaxExemptionAction } from './actions';
import { useRouter } from 'next/navigation';

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
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
        <button 
          onClick={() => setActiveTab('general')}
          style={{ padding: '16px 24px', fontWeight: activeTab === 'general' ? 600 : 400, borderBottom: activeTab === 'general' ? '2px solid var(--color-brand-gold)' : 'none', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'general' ? 'var(--color-brand-chocolate)' : 'var(--color-text-secondary)' }}
        >
          Général
        </button>
        <button 
          onClick={() => setActiveTab('folio')}
          style={{ padding: '16px 24px', fontWeight: activeTab === 'folio' ? 600 : 400, borderBottom: activeTab === 'folio' ? '2px solid var(--color-brand-gold)' : 'none', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'folio' ? 'var(--color-brand-chocolate)' : 'var(--color-text-secondary)' }}
        >
          Folio & Facturation
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {error && <div style={{ color: '#fff', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-status-error)', borderRadius: '4px', fontWeight: 500 }}>{error}</div>}

        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h3 style={{ marginBottom: '12px', color: 'var(--color-brand-chocolate)' }}>Informations Séjour</h3>
              <p><strong>Statut:</strong> <Badge status={reservation.status} /></p>
              <p><strong>Arrivée:</strong> {new Date(reservation.checkInDate).toLocaleDateString()}</p>
              <p><strong>Départ:</strong> {new Date(reservation.checkOutDate).toLocaleDateString()}</p>
              <p><strong>Tarif:</strong> {reservation.agreedRate} CFA</p>
              <p><strong>Exonéré de taxe:</strong> {reservation.taxExempt ? 'Oui' : 'Non'}</p>
            </div>
            <div>
              <h3 style={{ marginBottom: '12px', color: 'var(--color-brand-chocolate)' }}>Informations Chambre</h3>
              <p><strong>Numéro:</strong> {reservation.room?.number || 'Non assignée'}</p>
              <p><strong>Type:</strong> {reservation.room?.roomType?.name || 'N/A'}</p>
            </div>
          </div>
        )}

        {activeTab === 'folio' && (
          <div>
            {/* Folio Principal */}
            {mainFolio ? (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: 'var(--color-brand-chocolate)' }}>Folio Principal (Solde: {mainFolio.balance} CFA)</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Badge status={mainFolio.status === 'OPEN' ? 'CONFIRMED' : 'CHECKED_OUT'} /> {/* Hack: using CONFIRMED for green, CHECKED_OUT for grey */}
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

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Type</th>
                      <th style={{ padding: '12px' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainFolio.lines?.map((line: any) => (
                      <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px' }}>{new Date(line.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>{line.type}</td>
                        <td style={{ padding: '12px' }}>{line.description}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: line.amount < 0 ? 'var(--color-status-error)' : 'inherit' }}>
                          {line.amount} CFA
                        </td>
                      </tr>
                    ))}
                    {(!mainFolio.lines || mainFolio.lines.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>Aucune charge</td>
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
                <h3 style={{ color: 'var(--color-brand-chocolate)', marginBottom: '16px' }}>Autres Folios</h3>
                {otherFolios.map((f: any) => (
                  <div key={f.id} style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0 }}>Folio {f.type} (Solde: {f.balance} CFA)</h4>
                      <Badge status={f.status === 'OPEN' ? 'CONFIRMED' : 'CHECKED_OUT'} />
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <tbody>
                        {f.lines?.map((line: any) => (
                          <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '8px' }}>{new Date(line.createdAt).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>{line.type}</td>
                            <td style={{ padding: '8px' }}>{line.description}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: line.amount < 0 ? 'var(--color-status-error)' : 'inherit' }}>
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
              <div style={{ marginTop: '24px' }}>
                <Button variant="outline" onClick={() => setShowTaxModal(true)}>Forcer Exonération de taxe (Créera un folio d'ajustement)</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaxModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ marginTop: 0, color: 'var(--color-brand-chocolate)' }}>Exonération de taxe</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Veuillez fournir un motif obligatoire pour l'exonération (ex: diplomate, motif officiel).
            </p>
            <Input 
              label="Motif / Justificatif"
              value={taxExemptReason}
              onChange={(e) => setTaxExemptReason(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <Button variant="outline" onClick={() => setShowTaxModal(false)} disabled={loading}>Annuler</Button>
              <Button variant="primary" onClick={handleTaxExemption} disabled={loading || !taxExemptReason.trim()}>
                {loading ? <Spinner size="sm" /> : 'Appliquer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddLineModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ marginTop: 0, color: 'var(--color-brand-chocolate)' }}>Ajouter une charge</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>Type</label>
                <select 
                  value={newLine.type}
                  onChange={(e) => setNewLine({ ...newLine, type: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
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
