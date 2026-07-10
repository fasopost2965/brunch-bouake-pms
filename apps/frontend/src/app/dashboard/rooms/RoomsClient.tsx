'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { updateRoomAction } from './actions';
import { X, Sparkles, AlertTriangle, HelpCircle, Edit } from 'lucide-react';
import styles from './Rooms.module.css';

type RoomType = {
  id: number;
  name: string;
  capacity: number;
  baseRate: number;
};

type Room = {
  id: number;
  number: string;
  floor: number;
  occupancyStatus: 'VACANT' | 'OCCUPIED';
  cleanlinessStatus: 'CLEAN' | 'DIRTY' | 'INSPECTION';
  technicalStatus: 'OPERATIONAL' | 'MAINTENANCE';
  notes: string | null;
  roomType: RoomType;
};

export default function RoomsClient({ initialRooms, canWrite }: { initialRooms: Room[], canWrite: boolean }) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Form state
  const [cleanlinessStatus, setCleanlinessStatus] = useState<'CLEAN' | 'DIRTY' | 'INSPECTION'>('CLEAN');
  const [technicalStatus, setTechnicalStatus] = useState<'OPERATIONAL' | 'MAINTENANCE'>('OPERATIONAL');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [cleanFilter, setCleanFilter] = useState<string>('ALL');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('ALL');
  const [techFilter, setTechFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');

  // Dynamically find floors
  const floors = Array.from(new Set(initialRooms.map(r => r.floor.toString()))).sort();

  const handleCardClick = (room: Room) => {
    if (!canWrite) return;
    setSelectedRoom(room);
    setCleanlinessStatus(room.cleanlinessStatus);
    setTechnicalStatus(room.technicalStatus);
    setNotes(room.notes || '');
    setError(null);
  };

  const handleCloseModal = () => {
    setSelectedRoom(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setIsSubmitting(true);
    setError(null);

    const result = await updateRoomAction(selectedRoom.id, {
      cleanlinessStatus,
      technicalStatus,
      notes: notes || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.room) {
      // Update local state
      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, ...result.room } : r));
      setSelectedRoom(null);
    } else {
      setError(result.error || 'Une erreur est survenue lors de la mise à jour.');
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter(room => {
    const matchesClean = cleanFilter === 'ALL' || room.cleanlinessStatus === cleanFilter;
    const matchesOccupancy = occupancyFilter === 'ALL' || room.occupancyStatus === occupancyFilter;
    const matchesTech = techFilter === 'ALL' || room.technicalStatus === techFilter;
    const matchesFloor = floorFilter === 'ALL' || room.floor.toString() === floorFilter;
    return matchesClean && matchesOccupancy && matchesTech && matchesFloor;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Chambres & Inventaire</h1>
      </div>

      {/* Filters Bar */}
      <div className={styles.filters}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Propreté</label>
          <select value={cleanFilter} onChange={e => setCleanFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Tous les statuts de propreté</option>
            <option value="CLEAN">Propre (CLEAN)</option>
            <option value="DIRTY">Sale (DIRTY)</option>
            <option value="INSPECTION">Inspection</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Occupation</label>
          <select value={occupancyFilter} onChange={e => setOccupancyFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Toutes occupations</option>
            <option value="VACANT">Vacante (VACANT)</option>
            <option value="OCCUPIED">Occupée (OCCUPIED)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>État Technique</label>
          <select value={techFilter} onChange={e => setTechFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Tous états techniques</option>
            <option value="OPERATIONAL">Opérationnelle (OPERATIONAL)</option>
            <option value="MAINTENANCE">En maintenance</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Étage</label>
          <select value={floorFilter} onChange={e => setFloorFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Tous les étages</option>
            {floors.map(floor => (
              <option key={floor} value={floor}>Étage {floor}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className={styles.roomsGrid}>
        {filteredRooms.map(room => {
          const isClean = room.cleanlinessStatus === 'CLEAN';
          const isDirty = room.cleanlinessStatus === 'DIRTY';
          const isInspection = room.cleanlinessStatus === 'INSPECTION';
          const isOccupied = room.occupancyStatus === 'OCCUPIED';
          const isOperational = room.technicalStatus === 'OPERATIONAL';

          return (
            <div 
              key={room.id} 
              className={styles.roomCard}
              onClick={() => handleCardClick(room)}
            >
              <div className={styles.roomHeader}>
                <div className={styles.roomNumber}>Ch. {room.number}</div>
                <div className={styles.roomType}>{room.roomType.name}</div>
              </div>

              <div className={styles.badges}>
                {isClean && <span className={`${styles.badge} ${styles.badgeClean}`}>Propre</span>}
                {isDirty && <span className={`${styles.badge} ${styles.badgeDirty}`}>Sale</span>}
                {isInspection && <span className={`${styles.badge} ${styles.badgeInspection}`}>Inspection</span>}

                {isOccupied ? (
                  <span className={`${styles.badge} ${styles.badgeOccupied}`}>Occupée</span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeVacant}`}>Libre</span>
                )}

                {isOperational ? (
                  <span className={`${styles.badge} ${styles.badgeClean}`}>Prête</span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeMaintenance}`}>Maintenance</span>
                )}
              </div>

              {room.notes && (
                <div className={styles.roomNotes}>
                  <strong>Note:</strong> {room.notes}
                </div>
              )}

              {canWrite && (
                <div style={{ position: 'absolute', bottom: '16px', right: '16px', color: 'var(--color-text-secondary)' }}>
                  <Edit size={14} />
                </div>
              )}
            </div>
          );
        })}

        {filteredRooms.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            Aucune chambre ne correspond aux critères de recherche.
          </div>
        )}
      </div>

      {/* Edit Room Modal */}
      {selectedRoom && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSubmit} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Mettre à jour la Chambre {selectedRoom.number}</h2>
              <button type="button" onClick={handleCloseModal} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Statut de propreté</label>
              <select 
                value={cleanlinessStatus} 
                onChange={e => setCleanlinessStatus(e.target.value as any)} 
                className={styles.select}
                required
              >
                <option value="CLEAN">Propre (CLEAN)</option>
                <option value="DIRTY">Sale (DIRTY)</option>
                <option value="INSPECTION">En inspection (INSPECTION)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>État technique</label>
              <select 
                value={technicalStatus} 
                onChange={e => setTechnicalStatus(e.target.value as any)} 
                className={styles.select}
                required
              >
                <option value="OPERATIONAL">Opérationnel (OPERATIONAL)</option>
                <option value="MAINTENANCE">En maintenance (MAINTENANCE)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notes / Instructions de ménage</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className={styles.textarea}
                placeholder="Ex: Tache sur le tapis, ampoule à changer, ou instructions pour le ménage..."
              />
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="tertiary" onClick={handleCloseModal} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
