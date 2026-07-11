'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { createMaintenanceIssueAction, updateMaintenanceIssueAction } from './actions';
import { X, Wrench, User, Plus } from 'lucide-react';
import styles from './Maintenance.module.css';

type UserObj = {
  id: number;
  firstName: string;
  lastName: string;
  role: {
    name: string;
  };
};

type Room = {
  id: number;
  number: string;
};

type MaintenanceIssue = {
  id: number;
  roomId: number;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  reportedById: number;
  assignedToId: number | null;
  resolvedAt: string | null;
  createdAt: string;
  room: Room;
  reportedBy: UserObj;
  assignedTo: UserObj | null;
};

export default function MaintenanceClient({
  initialIssues,
  rooms,
  staff,
  canWrite,
}: {
  initialIssues: MaintenanceIssue[];
  rooms: Room[];
  staff: UserObj[];
  canWrite: boolean;
}) {
  const [issues, setIssues] = useState<MaintenanceIssue[]>(initialIssues);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<MaintenanceIssue | null>(null);

  // Form states (Create)
  const [createRoomId, setCreateRoomId] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSeverity, setCreateSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [createAssigneeId, setCreateAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states (Update)
  const [updateStatus, setUpdateStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('OPEN');
  const [updateAssigneeId, setUpdateAssigneeId] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoomId) {
      setError('Veuillez sélectionner une chambre.');
      return;
    }
    if (!createDescription.trim()) {
      setError('Veuillez entrer une description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createMaintenanceIssueAction({
      roomId: parseInt(createRoomId, 10),
      description: createDescription,
      severity: createSeverity,
      status: 'OPEN',
      assignedToId: createAssigneeId ? parseInt(createAssigneeId, 10) : undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      const rDetails = rooms.find(r => r.id === parseInt(createRoomId, 10));
      const uDetails = staff.find(s => s.id === (createAssigneeId ? parseInt(createAssigneeId, 10) : 0));
      
      const newIssueWithDetails: MaintenanceIssue = {
        ...result.data,
        room: rDetails || { id: parseInt(createRoomId, 10), number: 'Unknown' },
        assignedTo: uDetails || null,
        reportedBy: { id: 0, firstName: 'Moi', lastName: '', role: { name: 'Admin' } },
      };

      setIssues(prev => [newIssueWithDetails, ...prev]);
      setIsCreateModalOpen(false);
      resetCreateForm();
    } else {
      setError(result.error || 'Erreur lors de la création du ticket.');
    }
  };

  const resetCreateForm = () => {
    setCreateRoomId('');
    setCreateDescription('');
    setCreateSeverity('MEDIUM');
    setCreateAssigneeId('');
    setError(null);
  };

  const handleRowClick = (issue: MaintenanceIssue) => {
    if (!canWrite) return;
    setSelectedIssue(issue);
    setUpdateStatus(issue.status);
    setUpdateAssigneeId(issue.assignedToId?.toString() || '');
    setError(null);
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setIsSubmitting(true);
    setError(null);

    const result = await updateMaintenanceIssueAction(selectedIssue.id, {
      status: updateStatus,
      assignedToId: updateAssigneeId ? parseInt(updateAssigneeId, 10) : null,
    });

    setIsSubmitting(false);

    if (result.success) {
      const uDetails = staff.find(s => s.id === (updateAssigneeId ? parseInt(updateAssigneeId, 10) : 0));
      
      setIssues(prev => prev.map(issue => 
        issue.id === selectedIssue.id 
          ? { 
              ...issue, 
              status: updateStatus, 
              assignedToId: updateAssigneeId ? parseInt(updateAssigneeId, 10) : null,
              assignedTo: uDetails || null,
              resolvedAt: updateStatus === 'RESOLVED' ? new Date().toISOString() : null 
            } 
          : issue
      ));
      setSelectedIssue(null);
    } else {
      setError(result.error || 'Erreur lors de la mise à jour.');
    }
  };

  // Filter logic
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || issue.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const getSeverityName = (sev: string) => {
    switch (sev) {
      case 'LOW': return 'Faible';
      case 'MEDIUM': return 'Moyen';
      case 'HIGH': return 'Élevé';
      case 'CRITICAL': return 'Critique';
      default: return sev;
    }
  };

  const getStatusName = (st: string) => {
    switch (st) {
      case 'OPEN': return 'Ouvert';
      case 'IN_PROGRESS': return 'En Cours';
      case 'RESOLVED': return 'Résolu';
      default: return st;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tickets de Maintenance</h1>
        {canWrite && (
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
            <Plus size={16} style={{ marginRight: '8px' }} />
            Signaler un Problème
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Tous les statuts</option>
            <option value="OPEN">Ouvert</option>
            <option value="IN_PROGRESS">En Cours</option>
            <option value="RESOLVED">Résolu</option>
          </select>

          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Toutes sévérités</option>
            <option value="LOW">Faible (LOW)</option>
            <option value="MEDIUM">Moyen (MEDIUM)</option>
            <option value="HIGH">Élevé (HIGH)</option>
            <option value="CRITICAL">Critique (CRITICAL)</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Chambre</th>
              <th className={styles.th}>Description</th>
              <th className={styles.th}>Sévérité</th>
              <th className={styles.th}>Statut</th>
              <th className={styles.th}>Assigné à</th>
              <th className={styles.th}>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map(issue => (
              <tr 
                key={issue.id} 
                className={styles.tr} 
                onClick={() => handleRowClick(issue)}
                style={{ cursor: canWrite ? 'pointer' : 'default' }}
              >
                <td className={`${styles.td} ${styles.roomCell}`}>Ch. {issue.room.number}</td>
                <td className={`${styles.td} ${styles.descriptionCell}`} title={issue.description}>
                  {issue.description}
                </td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${styles[`severity${issue.severity}`]}`}>
                    {getSeverityName(issue.severity)}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${styles[`status${issue.status}`]}`}>
                    {getStatusName(issue.status)}
                  </span>
                </td>
                <td className={styles.td}>
                  {issue.assignedTo ? `${issue.assignedTo.firstName} ${issue.assignedTo.lastName}` : 'Non assigné'}
                </td>
                <td className={styles.td} style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(issue.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}

            {filteredIssues.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  Aucun ticket de maintenance trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleCreateIssue} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Signaler un incident technique</h2>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Chambre concernée</label>
              <select value={createRoomId} onChange={e => setCreateRoomId(e.target.value)} className={styles.select} required>
                <option value="">Sélectionner une chambre...</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Chambre {r.number}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Sévérité du problème</label>
              <select value={createSeverity} onChange={e => setCreateSeverity(e.target.value as any)} className={styles.select} required>
                <option value="LOW">Faible (Ex: Ampoule grillée)</option>
                <option value="MEDIUM">Moyen (Ex: Fuite d'eau légère)</option>
                <option value="HIGH">Élevé (Ex: Climatisation en panne)</option>
                <option value="CRITICAL">Critique (Ex: Inondation, électricité générale HS)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description du problème</label>
              <textarea 
                value={createDescription} 
                onChange={e => setCreateDescription(e.target.value)} 
                className={styles.textarea}
                placeholder="Décrivez précisément l'incident..."
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Assigner à un technicien</label>
              <select value={createAssigneeId} onChange={e => setCreateAssigneeId(e.target.value)} className={styles.select}>
                <option value="">Laisser non assigné</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role.name})</option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="tertiary" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Déclarer le ticket'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit/Update Status Modal */}
      {selectedIssue && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleUpdateIssue} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Traiter le ticket #{selectedIssue.id}</h2>
              <button type="button" onClick={() => setSelectedIssue(null)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: '16px', borderRadius: '8px', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Chambre {selectedIssue.room.number}</div>
              <div>{selectedIssue.description}</div>
            </div>

            {error && (
              <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Statut de traitement</label>
              <select value={updateStatus} onChange={e => setUpdateStatus(e.target.value as any)} className={styles.select} required>
                <option value="OPEN">Ouvert (OPEN)</option>
                <option value="IN_PROGRESS">En cours (IN_PROGRESS)</option>
                <option value="RESOLVED">Résolu (RESOLVED)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Assignation</label>
              <select value={updateAssigneeId} onChange={e => setUpdateAssigneeId(e.target.value)} className={styles.select}>
                <option value="">Non assigné</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role.name})</option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="tertiary" onClick={() => setSelectedIssue(null)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
