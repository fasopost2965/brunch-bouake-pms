import React from 'react';
import { cookies } from 'next/headers';

export type PermissionCode = 
  | 'settings.rooms.write'
  | 'users.create'
  | 'reservations.write'
  | 'reservation.tax_exempt'
  | 'billing.write'
  | 'billing.adjustment.create'
  | 'maintenance.write'
  | 'housekeeping.write'
  | 'reports.read'
  | 'reports.write';

interface RequirePermissionProps {
  code: PermissionCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ⚠️ ATTENTION : Sécurité Cosmétique Uniquement
 * 
 * Ce composant vérifie le token présent dans les cookies pour masquer 
 * ou afficher des éléments de l'interface (ex: masquer un bouton).
 * 
 * Il ne remplace EN AUCUN CAS la sécurité du backend. 
 * La vérification réelle d'autorisation (PermissionsGuard) est effectuée 
 * à 100% par l'API NestJS lors de l'exécution de l'action.
 */
export async function RequirePermission({ code, children, fallback = null }: RequirePermissionProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return <>{fallback}</>;
  }

  try {
    // Basic decoding of JWT payload (no signature verification needed for UI masking)
    const payloadBase64Url = token.split('.')[1];
    if (!payloadBase64Url) return <>{fallback}</>;
    
    const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);

    const userPermissions: string[] = payload.permissions || [];

    if (userPermissions.includes(code)) {
      return <>{children}</>;
    }

    return <>{fallback}</>;
  } catch (error) {
    console.error('Error decoding JWT in RequirePermission:', error);
    return <>{fallback}</>;
  }
}
