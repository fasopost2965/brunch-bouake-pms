import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface AuditLogData {
  userId?: number;
  action: string;
  entityType: string;
  entityId: number | string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  /**
   * Enregistre une action dans l'audit log.
   * Doit TOUJOURS être appelé avec un Prisma.TransactionClient (tx) pour garantir
   * que le log est créé dans la même transaction que l'action métier.
   */
  async logAction(
    tx: Prisma.TransactionClient,
    data: AuditLogData,
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        targetEntity: data.entityType,
        targetId: data.entityId.toString(),
        valueBefore: data.oldValues ? data.oldValues : null,
        valueAfter: data.newValues ? data.newValues : null,
        ipAddress: data.ipAddress,
      },
    });
  }
}
