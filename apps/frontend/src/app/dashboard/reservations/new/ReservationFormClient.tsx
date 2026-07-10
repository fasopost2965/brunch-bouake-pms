'use client';

import React, { useState } from 'react';
import { Button, Input, Spinner } from '@/components/ui';
import { createReservationAction } from './actions';
import { useRouter } from 'next/navigation';

export default function ReservationFormClient({ guests, rooms }: { guests: any[], rooms: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    guestId: '',
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    agreedRate: ''
  });

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roomId = e.target.value;
    const room = rooms.find(r => r.id.toString() === roomId);
    let newRate = formData.agreedRate;
    
    if (room && room.roomType) {
      newRate = room.roomType.baseRate.toString();
    }
    
    setFormData({
      ...formData,
      roomId,
      agreedRate: newRate
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      guestId: parseInt(formData.guestId, 10),
      roomId: formData.roomId ? parseInt(formData.roomId, 10) : undefined,
      agreedRate: parseFloat(formData.agreedRate)
    };

    const res = await createReservationAction(payload);
    
    if (res.success) {
      router.push('/dashboard/reservations');
    } else {
      // 409 Conflict handling for overlaps
      if (res.error.includes('409') || res.error.toLowerCase().includes('chevauchement') || res.error.toLowerCase().includes('overlap') || res.error.toLowerCase().includes('unavailable')) {
        setError('Erreur 409 : Cette chambre est déjà occupée ou réservée sur les dates sélectionnées.');
      } else {
        setError(res.error || 'Erreur lors de la création de la réservation.');
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', backgroundColor: '#fff', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
      {error && <div style={{ color: '#fff', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-status-error)', borderRadius: '4px', fontWeight: 500 }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>Client <span style={{color: 'red'}}>*</span></label>
          <select 
            value={formData.guestId}
            onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
            required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '1rem', outline: 'none' }}
          >
            <option value="">Sélectionner un client...</option>
            {guests.map(g => (
              <option key={g.id} value={g.id}>{g.firstName} {g.lastName} ({g.email || g.phone || 'Sans contact'})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input 
            label="Date d'arrivée"
            type="date"
            value={formData.checkInDate}
            onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
            required
          />
          <Input 
            label="Date de départ"
            type="date"
            value={formData.checkOutDate}
            onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>Chambre (Optionnel)</label>
            <select 
              value={formData.roomId}
              onChange={handleRoomChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '1rem', outline: 'none' }}
            >
              <option value="">Aucune (Assignation ultérieure)</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.number} ({r.roomType?.name})</option>
              ))}
            </select>
          </div>
          <Input 
            label="Tarif prévisionnel (CFA)"
            type="number"
            value={formData.agreedRate}
            onChange={(e) => setFormData({ ...formData, agreedRate: e.target.value })}
            required
            placeholder="Ex: 25000"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Créer la réservation'}
          </Button>
        </div>
      </form>
    </div>
  );
}
