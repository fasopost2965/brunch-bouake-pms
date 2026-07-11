'use client';

import React, { useState } from 'react';
import { Button, Badge, Input, Spinner } from '@/components/ui';
import { updateGuestAction, uploadDocumentAction } from './actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GuestDetailClient({ guest, canWrite }: { guest: any, canWrite: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: guest.firstName || '',
    lastName: guest.lastName || '',
    phone: guest.phone || '',
    email: guest.email || '',
    idType: guest.idType || 'CNI',
    idNumber: guest.idNumber || '',
    nationality: guest.nationality || '',
    notes: guest.notes || ''
  });

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [idType, setIdType] = useState('CNI');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await updateGuestAction(guest.id, formData);
    setLoading(false);

    if (res.success) {
      setSuccess('Profil mis à jour avec succès.');
      setIsEditing(false);
      router.refresh();
    } else {
      setError(res.error || 'Erreur lors de la mise à jour.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const data = new FormData();
    data.append('file', file);
    data.append('type', idType);

    const res = await uploadDocumentAction(guest.id, data);
    setLoading(false);

    if (res.success) {
      setSuccess('Document uploadé avec succès.');
      setFile(null);
      router.refresh();
    } else {
      setError(res.error || "Erreur lors de l'upload.");
    }
  };

  const totalNights = guest.reservations?.reduce((acc: number, res: any) => {
    if (res.status === 'CANCELLED' || res.status === 'NO_SHOW') return acc;
    const checkIn = new Date(res.checkInDate).getTime();
    const checkOut = new Date(res.checkOutDate).getTime();
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
    return acc + nights;
  }, 0) || 0;

  const totalSpent = guest.reservations?.reduce((acc: number, res: any) => {
    if (res.status === 'CANCELLED' || res.status === 'NO_SHOW') return acc;
    const mainFolio = res.folios?.find((f: any) => f.type === 'MAIN');
    if (!mainFolio) return acc;
    const folioTotal = mainFolio.lines?.reduce((sum: number, line: any) => sum + Number(line.amount), 0) || 0;
    return acc + folioTotal;
  }, 0) || 0;

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
          onClick={() => setActiveTab('documents')}
          style={{ padding: '16px 24px', fontWeight: activeTab === 'documents' ? 600 : 400, borderBottom: activeTab === 'documents' ? '2px solid var(--color-brand-gold)' : 'none', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'documents' ? 'var(--color-brand-chocolate)' : 'var(--color-text-secondary)' }}
        >
          Documents
        </button>
        <button 
          onClick={() => setActiveTab('reservations')}
          style={{ padding: '16px 24px', fontWeight: activeTab === 'reservations' ? 600 : 400, borderBottom: activeTab === 'reservations' ? '2px solid var(--color-brand-gold)' : 'none', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'reservations' ? 'var(--color-brand-chocolate)' : 'var(--color-text-secondary)' }}
        >
          Réservations
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {error && <div style={{ color: '#fff', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-status-error)', borderRadius: '4px', fontWeight: 500 }}>{error}</div>}
        {success && <div style={{ color: '#fff', marginBottom: '16px', padding: '12px', backgroundColor: '#10B981', borderRadius: '4px', fontWeight: 500 }}>{success}</div>}

        {activeTab === 'general' && (
          <div>
            {!isEditing ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-brand-chocolate)' }}>Informations Personnelles</h3>
                  {canWrite && <Button variant="outline" onClick={() => setIsEditing(true)}>Modifier</Button>}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <p><strong>Nom:</strong> {guest.lastName}</p>
                    <p><strong>Prénom:</strong> {guest.firstName}</p>
                    <p><strong>Email:</strong> {guest.email || 'N/A'}</p>
                    <p><strong>Téléphone:</strong> {guest.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>Type de pièce:</strong> {guest.idType || 'N/A'}</p>
                    <p><strong>Numéro de pièce:</strong> {guest.idNumber || 'N/A'}</p>
                    <p><strong>Nationalité:</strong> {guest.nationality || 'N/A'}</p>
                    <p><strong>Notes:</strong> {guest.notes || 'N/A'}</p>
                  </div>
                </div>

                <h3 style={{ margin: 0, color: 'var(--color-brand-chocolate)', marginBottom: '16px' }}>Statistiques (KPI)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                   <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                     <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Total Nuitées</p>
                     <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-brand-chocolate)' }}>{totalNights}</p>
                   </div>
                   <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                     <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Dépenses Totales</p>
                     <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-brand-chocolate)' }}>{totalSpent} CFA</p>
                   </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-brand-chocolate)' }}>Modifier le Profil</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>Annuler</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? <Spinner size="sm" /> : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
                
                <div className={` ${loading ? 'skeleton-pulse' : ''}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input label="Nom" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                  <Input label="Prénom" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                  <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <Input label="Téléphone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>Type de pièce</label>
                    <select 
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    >
                      <option value="CNI">CNI</option>
                      <option value="PASSPORT">Passeport</option>
                      <option value="RESIDENCE_PERMIT">Carte de résident</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  
                  <Input label="Numéro de pièce" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
                  <Input label="Nationalité" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
                  <Input label="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h3 style={{ color: 'var(--color-brand-chocolate)', marginBottom: '16px' }}>Documents d'identité</h3>
            
            {canWrite && (
              <form onSubmit={handleUpload} style={{ marginBottom: '32px', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-surface-hover)' }}>
                <h4 style={{ marginTop: 0 }}>Ajouter un document</h4>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>Fichier</label>
                    <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required style={{ display: 'block', width: '100%' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>Type</label>
                    <select 
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    >
                      <option value="CNI">CNI</option>
                      <option value="PASSPORT">Passeport</option>
                      <option value="RESIDENCE_PERMIT">Carte de résident</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  <Button variant="primary" type="submit" disabled={loading || !file}>
                    {loading ? <Spinner size="sm" /> : 'Uploader'}
                  </Button>
                </div>
              </form>
            )}

            {guest.documents && guest.documents.length > 0 ? (
               <table className={` ${loading ? 'skeleton-pulse' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                   <th style={{ padding: '12px' }}>Type</th>
                   <th style={{ padding: '12px' }}>Date d'upload</th>
                   <th style={{ padding: '12px' }}>Lien</th>
                 </tr>
               </thead>
               <tbody>
                 {guest.documents.map((doc: any) => (
                   <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                     <td style={{ padding: '12px' }}>{doc.type}</td>
                     <td style={{ padding: '12px' }}>{new Date(doc.uploadedAt).toLocaleString()}</td>
                     <td style={{ padding: '12px' }}>
                        <a href={doc.storageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-gold)' }}>Voir le document</a>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)' }}>Aucun document n'a été uploadé pour ce client.</p>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div>
            <h3 style={{ color: 'var(--color-brand-chocolate)', marginBottom: '16px' }}>Historique des réservations</h3>
            {guest.reservations && guest.reservations.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Dates</th>
                    <th style={{ padding: '12px' }}>Statut</th>
                    <th style={{ padding: '12px' }}>Chambre</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guest.reservations.map((res: any) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}>#{res.id}</td>
                      <td style={{ padding: '12px' }}>
                        {new Date(res.checkInDate).toLocaleDateString()} - {new Date(res.checkOutDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}><Badge status={res.status} /></td>
                      <td style={{ padding: '12px' }}>{res.roomId || 'Non assignée'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                         <Link href={`/dashboard/reservations/${res.id}`} style={{ color: 'var(--color-brand-gold)', textDecoration: 'none', fontWeight: 500 }}>
                            Voir
                         </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)' }}>Aucune réservation pour ce client.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
