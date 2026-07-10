'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { createHousekeepingTaskAction, updateHousekeepingTaskAction } from './actions';
import { X, Sparkles, User, AlertCircle, Plus } from 'lucide-react';
import styles from './Housekeeping.module.css';

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

type HousekeepingTask = {
  id: number;
  roomId: number;
  type: 'CHECKOUT_CLEAN' | 'STAYOVER_CLEAN' | 'INSPECTION' | 'DEEP_CLEAN';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  inspectionResult: 'CLEAN' | 'DIRTY' | 'INSPECTION' | null;
  assignedToId: number | null;
  notes: string | null;
  createdAt: string;
  room: Room;
  assignedTo: UserObj | null;
  reportedBy: UserObj;
};

export default function HousekeepingClient({
  initialTasks,
  rooms,
  staff,
  canWrite,
}: {
  initialTasks: HousekeepingTask[];
  rooms: Room[];
  staff: UserObj[];
  canWrite: boolean;
}) {
  const [tasks, setTasks] = useState<HousekeepingTask[]>(initialTasks);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [activeTaskForInspection, setActiveTaskForInspection] = useState<HousekeepingTask | null>(null);

  // Task creation state
  const [createRoomId, setCreateRoomId] = useState<string>('');
  const [createType, setCreateType] = useState<'CHECKOUT_CLEAN' | 'STAYOVER_CLEAN' | 'INSPECTION' | 'DEEP_CLEAN'>('CHECKOUT_CLEAN');
  const [createPriority, setCreatePriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [createAssigneeId, setCreateAssigneeId] = useState<string>('');
  const [createNotes, setCreateNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspection modal state
  const [inspectionResult, setInspectionResult] = useState<'CLEAN' | 'DIRTY' | 'INSPECTION'>('CLEAN');

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoomId) {
      setError('Veuillez sélectionner une chambre.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createHousekeepingTaskAction({
      roomId: parseInt(createRoomId, 10),
      type: createType,
      status: 'TODO',
      priority: createPriority,
      assignedToId: createAssigneeId ? parseInt(createAssigneeId, 10) : undefined,
      notes: createNotes || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.task) {
      // Find room details to append correctly
      const rDetails = rooms.find(r => r.id === parseInt(createRoomId, 10));
      const uDetails = staff.find(s => s.id === (createAssigneeId ? parseInt(createAssigneeId, 10) : 0));
      
      const newTaskWithDetails: HousekeepingTask = {
        ...result.task,
        room: rDetails || { id: parseInt(createRoomId, 10), number: 'Unknown' },
        assignedTo: uDetails || null,
        reportedBy: { id: 0, firstName: 'Moi', lastName: '', role: { name: 'Admin' } }, // Simple placeholder
      };

      setTasks(prev => [newTaskWithDetails, ...prev]);
      setIsCreateModalOpen(false);
      resetCreateForm();
    } else {
      setError(result.error || 'Erreur lors de la création de la tâche.');
    }
  };

  const resetCreateForm = () => {
    setCreateRoomId('');
    setCreateType('CHECKOUT_CLEAN');
    setCreatePriority('NORMAL');
    setCreateAssigneeId('');
    setCreateNotes('');
    setError(null);
  };

  const handleUpdateStatus = async (task: HousekeepingTask, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!canWrite) return;

    if (newStatus === 'DONE' && task.type === 'INSPECTION') {
      // Need inspection result first
      setActiveTaskForInspection(task);
      setInspectionResult('CLEAN');
      setIsInspectionModalOpen(true);
      return;
    }

    // Direct update
    const result = await updateHousekeepingTaskAction(task.id, { status: newStatus });
    if (result.success) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completedAt: newStatus === 'DONE' ? new Date().toISOString() : null } : t));
    } else {
      alert(result.error || 'Erreur de transition de statut.');
    }
  };

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskForInspection) return;

    setIsSubmitting(true);
    const result = await updateHousekeepingTaskAction(activeTaskForInspection.id, {
      status: 'DONE',
      inspectionResult,
    });
    setIsSubmitting(false);

    if (result.success) {
      setTasks(prev => prev.map(t => t.id === activeTaskForInspection.id ? { ...t, status: 'DONE', inspectionResult, completedAt: new Date().toISOString() } : t));
      setIsInspectionModalOpen(false);
      setActiveTaskForInspection(null);
    } else {
      setError(result.error || 'Erreur lors de la validation.');
    }
  };

  const handleAssignChange = async (task: HousekeepingTask, userId: number | null) => {
    if (!canWrite) return;
    const result = await updateHousekeepingTaskAction(task.id, { assignedToId: userId });
    if (result.success) {
      const uDetails = staff.find(s => s.id === userId);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assignedToId: userId, assignedTo: uDetails || null } : t));
    } else {
      alert(result.error || "Erreur lors de l'assignation.");
    }
  };

  // Filtering
  const filteredTasks = tasks.filter(task => {
    const matchesType = typeFilter === 'ALL' || task.type === typeFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    
    let matchesAssignee = true;
    if (assigneeFilter !== 'ALL') {
      if (assigneeFilter === 'UNASSIGNED') {
        matchesAssignee = task.assignedToId === null;
      } else {
        matchesAssignee = task.assignedToId?.toString() === assigneeFilter;
      }
    }

    return matchesType && matchesPriority && matchesAssignee;
  });

  const getTasksByStatus = (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    return filteredTasks.filter(t => t.status === status);
  };

  const getTaskTypeName = (type: string) => {
    switch (type) {
      case 'CHECKOUT_CLEAN': return 'Ménage Départ';
      case 'STAYOVER_CLEAN': return 'Ménage Recouche';
      case 'INSPECTION': return 'Contrôle / Inspection';
      case 'DEEP_CLEAN': return 'Ménage à Fond';
      default: return type;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Housekeeping & Nettoyage</h1>
        {canWrite && (
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
            <Plus size={16} style={{ marginRight: '8px' }} />
            Nouvelle Tâche
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Tous les types de ménage</option>
            <option value="CHECKOUT_CLEAN">Ménage Départ</option>
            <option value="STAYOVER_CLEAN">Ménage Recouche</option>
            <option value="INSPECTION">Inspection</option>
            <option value="DEEP_CLEAN">Ménage à Fond</option>
          </select>

          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Toutes priorités</option>
            <option value="LOW">Faible (LOW)</option>
            <option value="NORMAL">Normale (NORMAL)</option>
            <option value="HIGH">Haute (HIGH)</option>
            <option value="URGENT">Urgente (URGENT)</option>
          </select>

          <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className={styles.filterSelect}>
            <option value="ALL">Tous les assignataires</option>
            <option value="UNASSIGNED">Non assigné</option>
            {staff.map(s => (
              <option key={s.id} value={s.id.toString()}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Board */}
      <div className={styles.board}>
        {/* TODO COLUMN */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnTitle}>À faire (TODO)</span>
            <span className={styles.columnCount}>{getTasksByStatus('TODO').length}</span>
          </div>
          <div className={styles.tasksList}>
            {getTasksByStatus('TODO').map(task => (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <span className={styles.roomNum}>Chambre {task.room.number}</span>
                  <span className={`${styles.priorityBadge} ${styles[`priority${task.priority}`]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className={styles.taskType}>{getTaskTypeName(task.type)}</div>
                
                {task.notes && <div className={styles.taskNotes}>{task.notes}</div>}
                
                <div className={styles.taskAssignee}>
                  <User size={14} />
                  {canWrite ? (
                    <select 
                      value={task.assignedToId || ''} 
                      onChange={e => handleAssignChange(task, e.target.value ? parseInt(e.target.value, 10) : null)}
                      style={{ border: 'none', background: 'transparent', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                    >
                      <option value="">Non assigné</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Non assigné'}</span>
                  )}
                </div>

                {canWrite && (
                  <div className={styles.taskActions}>
                    <Button onClick={() => handleUpdateStatus(task, 'IN_PROGRESS')} variant="tertiary" style={{ width: '100%', padding: '6px 12px', fontSize: '0.8125rem' }}>
                      Démarrer
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnTitle}>En cours (IN PROGRESS)</span>
            <span className={styles.columnCount}>{getTasksByStatus('IN_PROGRESS').length}</span>
          </div>
          <div className={styles.tasksList}>
            {getTasksByStatus('IN_PROGRESS').map(task => (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <span className={styles.roomNum}>Chambre {task.room.number}</span>
                  <span className={`${styles.priorityBadge} ${styles[`priority${task.priority}`]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className={styles.taskType}>{getTaskTypeName(task.type)}</div>
                
                {task.notes && <div className={styles.taskNotes}>{task.notes}</div>}
                
                <div className={styles.taskAssignee}>
                  <User size={14} />
                  <span>{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Non assigné'}</span>
                </div>

                {canWrite && (
                  <div className={styles.taskActions}>
                    <Button onClick={() => handleUpdateStatus(task, 'TODO')} variant="tertiary" style={{ flex: 1, padding: '6px 12px', fontSize: '0.8125rem' }}>
                      Pause
                    </Button>
                    <Button onClick={() => handleUpdateStatus(task, 'DONE')} variant="primary" style={{ flex: 1, padding: '6px 12px', fontSize: '0.8125rem' }}>
                      Terminer
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnTitle}>Terminé (DONE)</span>
            <span className={styles.columnCount}>{getTasksByStatus('DONE').length}</span>
          </div>
          <div className={styles.tasksList}>
            {getTasksByStatus('DONE').map(task => (
              <div key={task.id} className={styles.taskCard} style={{ opacity: 0.85 }}>
                <div className={styles.taskHeader}>
                  <span className={styles.roomNum}>Chambre {task.room.number}</span>
                  <span className={`${styles.priorityBadge} ${styles[`priority${task.priority}`]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className={styles.taskType}>{getTaskTypeName(task.type)}</div>
                
                {task.notes && <div className={styles.taskNotes}>{task.notes}</div>}
                
                <div className={styles.taskAssignee}>
                  <User size={14} />
                  <span>Terminé par {task.assignedTo ? task.assignedTo.firstName : 'Employé'}</span>
                </div>

                {task.type === 'INSPECTION' && task.inspectionResult && (
                  <div style={{ marginTop: '8px', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Contrôle :</span>
                    <span style={{ 
                      color: task.inspectionResult === 'CLEAN' ? '#2E7D32' : task.inspectionResult === 'DIRTY' ? '#C62828' : '#6A1B9A',
                      textTransform: 'uppercase'
                    }}>{task.inspectionResult}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleCreateTask} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Créer une tâche de nettoyage</h2>
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
              <label className={styles.label}>Chambre</label>
              <select value={createRoomId} onChange={e => setCreateRoomId(e.target.value)} className={styles.select} required>
                <option value="">Sélectionner une chambre...</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Chambre {r.number}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Type de tâche</label>
              <select value={createType} onChange={e => setCreateType(e.target.value as any)} className={styles.select} required>
                <option value="CHECKOUT_CLEAN">Ménage Départ (CHECKOUT_CLEAN)</option>
                <option value="STAYOVER_CLEAN">Ménage Recouche (STAYOVER_CLEAN)</option>
                <option value="INSPECTION">Inspection / Contrôle (INSPECTION)</option>
                <option value="DEEP_CLEAN">Nettoyage à Fond (DEEP_CLEAN)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Priorité</label>
              <select value={createPriority} onChange={e => setCreatePriority(e.target.value as any)} className={styles.select} required>
                <option value="LOW">Faible (LOW)</option>
                <option value="NORMAL">Normale (NORMAL)</option>
                <option value="HIGH">Haute (HIGH)</option>
                <option value="URGENT">Urgente (URGENT)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Assigner à</label>
              <select value={createAssigneeId} onChange={e => setCreateAssigneeId(e.target.value)} className={styles.select}>
                <option value="">Laisser non assigné</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role.name})</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notes / Consignes particulières</label>
              <textarea 
                value={createNotes} 
                onChange={e => setCreateNotes(e.target.value)} 
                className={styles.textarea}
                placeholder="Ex: Changer les draps, nettoyer la vitre extérieure, etc..."
              />
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="tertiary" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Créer la tâche'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Inspection Result Validation Modal */}
      {isInspectionModalOpen && activeTaskForInspection && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleInspectionSubmit} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Valider l'Inspection (Chambre {activeTaskForInspection.room.number})</h2>
              <button type="button" onClick={() => setIsInspectionModalOpen(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#E8F5E9', borderRadius: '8px', fontSize: '0.875rem', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>Pour clore une tâche d'inspection, vous devez obligatoirement déclarer le résultat du contrôle.</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Résultat du contrôle de propreté</label>
              <select 
                value={inspectionResult} 
                onChange={e => setInspectionResult(e.target.value as any)} 
                className={styles.select}
                required
              >
                <option value="CLEAN">Propre (CLEAN)</option>
                <option value="DIRTY">Sale (DIRTY)</option>
                <option value="INSPECTION">Inspection à poursuivre (INSPECTION)</option>
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="tertiary" onClick={() => setIsInspectionModalOpen(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Validation...' : 'Valider & Clôturer'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
