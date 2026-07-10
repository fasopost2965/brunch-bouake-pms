'use client';

import React from 'react';
import { Button } from '@/components/ui';
import Link from 'next/link';

type Guest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  idType: string | null;
  idNumber: string | null;
};

export default function GuestsClient({ initialGuests, canWrite }: { initialGuests: Guest[], canWrite: boolean }) {
  return (
    <div>
      {canWrite && (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/dashboard/guests/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Nouveau Client</Button>
          </Link>
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Nom</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Prénom</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Email</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Téléphone</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Pièce d'identité</th>
            </tr>
          </thead>
          <tbody>
            {initialGuests.map((guest) => (
              <tr key={guest.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{guest.lastName}</td>
                <td style={{ padding: '16px' }}>{guest.firstName}</td>
                <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>{guest.email || '-'}</td>
                <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>{guest.phone || '-'}</td>
                <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>
                  {guest.idType ? `${guest.idType} (${guest.idNumber})` : '-'}
                </td>
              </tr>
            ))}
            {initialGuests.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
                  Aucun client trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
