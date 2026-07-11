'use client';

import React, { useState } from 'react';
import { Button, Input, Spinner } from '@/components/ui';
import { createGuestAction } from '../actions';
import { useRouter } from 'next/navigation';

export default function GuestFormClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idType: '',
    idNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sanitizeData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
    );

    const res = await createGuestAction(sanitizeData);
    
    if (res.success) {
      router.push('/dashboard/guests');
    } else {
      setError(res.error || 'Erreur lors de la création du client.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', backgroundColor: '#fff', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
      {error && <div style={{ color: 'var(--color-status-error)', marginBottom: '16px', padding: '12px', backgroundColor: '#FEE2E2', borderRadius: '4px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input 
            label="Prénom"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input 
            label="Nom"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input 
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input 
            label="Téléphone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>Type de pièce d'identité</label>
            <select 
              value={formData.idType}
              onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '1rem', outline: 'none' }}
            >
              <option value="">Sélectionner...</option>
              <option value="CNI">Carte d'identité</option>
              <option value="PASSPORT">Passeport</option>
              <option value="RESIDENCE_PERMIT">Titre de séjour</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <Input 
            label="Numéro de pièce"
            value={formData.idNumber}
            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Créer le client'}
          </Button>
        </div>
      </form>
    </div>
  );
}
