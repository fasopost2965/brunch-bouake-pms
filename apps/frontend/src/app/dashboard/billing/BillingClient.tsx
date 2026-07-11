'use client';

import React, { useState } from 'react';
import { Button, Input, Spinner, Badge } from '@/components/ui';
import { Search, Eye, FileSpreadsheet, Plus, X } from 'lucide-react';
import { addFolioLineAction, addPaymentAction, closeFolioAction, createAdjustmentFolioAction } from './actions';
import styles from './Billing.module.css';

// Types
type FolioLine = { id: number; type: string; description: string; amount: number; quantity: number; unitPrice: number; isAdjustment: boolean; createdAt: string; };
type Payment = { id: number; method: string; amount: number; status: string; reference?: string; paidAt?: string; createdAt?: string; };
type Folio = { id: number; type: 'MAIN' | 'ADJUSTMENT'; status: 'OPEN' | 'CLOSED'; balanceDue: number; lines: FolioLine[]; payments: Payment[]; reservationId: number; guestName: string; roomNumber: string; totalCharges: number; totalPaid: number; balance: number; invoice?: { legalNumber: string } };

export default function BillingClient({ reservations, canClose }: { reservations: any[], canClose: boolean }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFolio, setSelectedFolio] = useState<Folio | null>(null);

  // Forms State
  const [lineData, setLineData] = useState({ type: 'SERVICE', description: '', unitPrice: '', quantity: '1' });
  const [paymentData, setPaymentData] = useState({ method: 'CARD', amount: '', reference: '' });
  const [adjustmentData, setAdjustmentData] = useState({ justification: '' });

  const allFolios: Folio[] = reservations.flatMap(res => 
    res.folios.map((folio: any) => {
      const totalCharges = folio.lines?.reduce((sum: number, line: any) => sum + parseFloat(line.amount), 0) || 0;
      const totalPaid = folio.payments?.filter((p: any) => p.status === 'COMPLETED').reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
      const balance = parseFloat(folio.balanceDue || 0);

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

  const filteredFolios = allFolios.filter(folio => 
    folio.guestName.toLowerCase().includes(search.toLowerCase()) || 
    folio.roomNumber.includes(search) || 
    folio.id.toString().includes(search) ||
    folio.reservationId.toString().includes(search)
  );

  // Updated Folio State hook to keep modal in sync after Server Actions
  const currentFolio = selectedFolio ? allFolios.find(f => f.id === selectedFolio.id) || selectedFolio : null;

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFolio) return;
    setLoading(true); setError(''); setSuccess('');
    
    const payload = {
      ...lineData,
      unitPrice: parseFloat(lineData.unitPrice),
      quantity: parseInt(lineData.quantity, 10)
    };
    
    const res = await addFolioLineAction(currentFolio.id, payload);
    setLoading(false);
    if (res.success) {
      setSuccess('Charge ajoutée avec succès.');
      setLineData({ type: 'SERVICE', description: '', unitPrice: '', quantity: '1' });
    } else {
      setError(res.error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFolio) return;
    setLoading(true); setError(''); setSuccess('');
    
    const payload = {
      ...paymentData,
      amount: parseFloat(paymentData.amount)
    };
    
    const res = await addPaymentAction(currentFolio.id, payload);
    setLoading(false);
    if (res.success) {
      setSuccess('Paiement enregistré avec succès.');
      setPaymentData({ method: 'CARD', amount: '', reference: '' });
    } else {
      setError(res.error);
    }
  };

  const handleCloseFolio = async () => {
    if (!currentFolio || !canClose) return;
    if (currentFolio.balance !== 0 && !window.confirm("Le solde n'est pas nul. Voulez-vous forcer la clôture ?")) return;
    
    setLoading(true); setError(''); setSuccess('');
    let overrideReason = '';
    if (currentFolio.balance !== 0) {
      overrideReason = window.prompt('Veuillez entrer une raison pour la clôture forcée :') || '';
      if (!overrideReason) {
        setLoading(false);
        setError('Raison obligatoire pour clôture forcée.');
        return;
      }
    }

    const res = await closeFolioAction(currentFolio.id, { override: currentFolio.balance !== 0, overrideReason });
    setLoading(false);
    if (res.success) {
      setSuccess('Folio clôturé et facture générée.');
    } else {
      setError(res.error);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFolio) return;
    setLoading(true); setError(''); setSuccess('');
    
    const res = await createAdjustmentFolioAction(currentFolio.reservationId, adjustmentData.justification);
    setLoading(false);
    if (res.success) {
      setSuccess("Folio d'ajustement créé avec succès.");
      setAdjustmentData({ justification: '' });
      setSelectedFolio(null); // Close modal, let user find the new folio
    } else {
      setError(res.error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Folios & Facturation Globale</h1>
      </div>

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
      </div>

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
                <td className={styles.td}>#RS-{folio.reservationId}</td>
                <td className={styles.td} style={{ fontWeight: 500 }}>{folio.guestName}</td>
                <td className={`${styles.td} ${styles.roomCell}`}>Ch. {folio.roomNumber}</td>
                <td className={styles.td}><Badge status={folio.type} label={folio.type} /></td>
                <td className={styles.td}><Badge status={folio.status} label={folio.status} /></td>
                <td className={`${styles.td} ${styles.amountCell}`}>{folio.totalCharges.toLocaleString('fr-FR')} CFA</td>
                <td className={`${styles.td} ${styles.amountCell}`} style={{ color: '#2E7D32' }}>{folio.totalPaid.toLocaleString('fr-FR')} CFA</td>
                <td className={`${styles.td} ${styles.balanceCell}`} style={{ color: folio.balance > 0 ? 'var(--color-status-error)' : '#2E7D32' }}>
                  {folio.balance.toLocaleString('fr-FR')} CFA
                </td>
                <td className={styles.td} style={{ textAlign: 'center' }}>
                  <Button variant="tertiary" size="small" onClick={() => setSelectedFolio(folio)}>
                    Gérer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Gestion de Folio */}
      {currentFolio && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            <button onClick={() => setSelectedFolio(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="var(--color-text-secondary)" />
            </button>
            
            <h2 style={{ color: 'var(--color-brand-chocolate)', marginBottom: '8px' }}>
              Folio #{currentFolio.id} - {currentFolio.guestName}
            </h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
               <Badge status={currentFolio.status} label={`Statut: ${currentFolio.status}`} />
               <Badge status={currentFolio.type} label={`Type: ${currentFolio.type}`} />
               {currentFolio.invoice && <Badge status="NEUTRAL" label={`Facture: ${currentFolio.invoice.legalNumber}`} />}
            </div>

            {error && <div style={{ color: '#fff', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-status-error)', borderRadius: '4px', fontWeight: 500 }}>{error}</div>}
            {success && <div style={{ color: '#fff', marginBottom: '16px', padding: '12px', backgroundColor: '#10B981', borderRadius: '4px', fontWeight: 500 }}>{success}</div>}

            {/* KPI Cards for Folio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Charges</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{currentFolio.totalCharges.toLocaleString('fr-FR')} CFA</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--color-status-success-bg)', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.875rem', color: '#065F46' }}>Total Payé</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#065F46' }}>{currentFolio.totalPaid.toLocaleString('fr-FR')} CFA</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: currentFolio.balance > 0 ? 'var(--color-status-error-bg)' : 'var(--color-bg-subtle)', borderRadius: '8px', border: currentFolio.balance > 0 ? '1px solid #FECACA' : '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.875rem', color: currentFolio.balance > 0 ? '#991B1B' : 'var(--color-text-secondary)' }}>Solde Dû</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: currentFolio.balance > 0 ? '#991B1B' : 'var(--color-text-primary)' }}>{currentFolio.balance.toLocaleString('fr-FR')} CFA</div>
              </div>
            </div>

            {/* Content Tabs / Sections */}
            <div style={{ display: 'flex', gap: '24px' }}>
              
              {/* Left Column: Lines & Payments */}
              <div style={{ flex: 2 }}>
                <h3 style={{ fontSize: '1.125rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Lignes de Facturation</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px' }}>
                  {currentFolio.lines?.map(line => (
                    <li key={line.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border)' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{line.description} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>({line.type})</span></div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{line.quantity} x {Number(line.unitPrice).toLocaleString()} CFA</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>{Number(line.amount).toLocaleString()} CFA</div>
                    </li>
                  ))}
                  {(!currentFolio.lines || currentFolio.lines.length === 0) && <li style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Aucune charge.</li>}
                </ul>

                <h3 style={{ fontSize: '1.125rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Paiements</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {currentFolio.payments?.map(p => (
                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border)' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.method} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>({p.status})</span></div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Réf: {p.reference || 'N/A'} - {new Date(p.paidAt || p.createdAt || new Date()).toLocaleString()}</div>
                      </div>
                      <div style={{ fontWeight: 600, color: '#2E7D32' }}>+ {Number(p.amount).toLocaleString()} CFA</div>
                    </li>
                  ))}
                  {(!currentFolio.payments || currentFolio.payments.length === 0) && <li style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Aucun paiement.</li>}
                </ul>
              </div>

              {/* Right Column: Actions */}
              <div style={{ flex: 1, backgroundColor: 'var(--color-bg-subtle)', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Actions</h3>
                
                {currentFolio.status === 'OPEN' ? (
                  <>
                    {/* Add Line Form */}
                    <form onSubmit={handleAddLine} style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '8px' }}>Ajouter une charge</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <select value={lineData.type} onChange={e => setLineData({...lineData, type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          <option value="SERVICE">Service (Resto, Minibar)</option>
                          <option value="ACCOMMODATION">Hébergement</option>
                          <option value="PENALTY">Pénalité</option>
                        </select>
                        <Input placeholder="Description" value={lineData.description} onChange={e => setLineData({...lineData, description: e.target.value})} required />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Input placeholder="Prix Unitaire" type="number" value={lineData.unitPrice} onChange={e => setLineData({...lineData, unitPrice: e.target.value})} required />
                          <Input placeholder="Qté" type="number" value={lineData.quantity} onChange={e => setLineData({...lineData, quantity: e.target.value})} style={{ width: '60px' }} required />
                        </div>
                        <Button type="submit" variant="outline" size="small" disabled={loading}>
                          {loading ? <Spinner size="sm" /> : 'Ajouter'}
                        </Button>
                      </div>
                    </form>

                    {/* Add Payment Form */}
                    <form onSubmit={handleAddPayment} style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '8px' }}>Encaisser un paiement</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          <option value="CASH">Espèces</option>
                          <option value="CARD">Carte Bancaire</option>
                          <option value="MOBILE_MONEY">Mobile Money</option>
                          <option value="BANK_TRANSFER">Virement</option>
                        </select>
                        <Input placeholder="Montant" type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} required />
                        <Input placeholder="Référence (Optionnel)" value={paymentData.reference} onChange={e => setPaymentData({...paymentData, reference: e.target.value})} />
                        <Button type="submit" variant="outline" size="small" disabled={loading}>
                          {loading ? <Spinner size="sm" /> : 'Encaisser'}
                        </Button>
                      </div>
                    </form>

                    {/* Close Folio Action */}
                    {canClose ? (
                       <Button type="button" variant="primary" style={{ width: '100%' }} onClick={handleCloseFolio} disabled={loading}>
                         {loading ? <Spinner size="sm" /> : 'Clôturer le Folio'}
                       </Button>
                    ) : (
                       <div style={{ fontSize: '0.75rem', color: 'var(--color-status-error)', textAlign: 'center' }}>Permission insuffisante pour clôturer.</div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ padding: '12px', backgroundColor: 'var(--color-status-info-bg)', borderRadius: '4px', color: '#1E3A8A', fontSize: '0.875rem', marginBottom: '16px' }}>
                      Ce folio est clôturé (immuable). Toute modification nécessite la création d'un folio d'ajustement.
                    </div>
                    
                    <form onSubmit={handleCreateAdjustment}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '8px' }}>Créer un Folio Correctif</h4>
                      <Input placeholder="Justification (Ex: Erreur facturation)" value={adjustmentData.justification} onChange={e => setAdjustmentData({...adjustmentData, justification: e.target.value})} required />
                      <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Créer Ajustement'}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
