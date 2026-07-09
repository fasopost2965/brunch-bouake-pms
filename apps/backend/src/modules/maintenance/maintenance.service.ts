import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async getIssues() {
    return this.prisma.maintenanceIssue.findMany({
      include: { room: true, reportedBy: true, assignedTo: true },
    });
  }

  async createIssue(data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.maintenanceIssue.create({
        data: {
          ...data,
          reportedById: adminId,
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'MaintenanceIssue',
        entityId: issue.id,
        newValues: issue,
      });

      if (issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') {
        await tx.room.update({
          where: { id: issue.roomId },
          data: { technicalStatus: 'MAINTENANCE' },
        });
      }

      return issue;
    });
  }

  async updateIssue(id: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.maintenanceIssue.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('MaintenanceIssue not found');

      const issue = await tx.maintenanceIssue.update({ where: { id }, data });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPDATE',
        entityType: 'MaintenanceIssue',
        entityId: issue.id,
        oldValues: old,
        newValues: issue,
      });

      if (issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') {
        await tx.room.update({
          where: { id: issue.roomId },
          data: { technicalStatus: 'MAINTENANCE' },
        });
      } else if (issue.status === 'RESOLVED' && old.status !== 'RESOLVED') {
        // Check if there are other unresolved issues for this room
        const openIssuesCount = await tx.maintenanceIssue.count({
          where: {
            roomId: issue.roomId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            id: { not: issue.id },
          },
        });

        if (openIssuesCount === 0) {
          await tx.room.update({
            where: { id: issue.roomId },
            data: { technicalStatus: 'OPERATIONAL' },
          });
        }
      }

      return issue;
    });
  }
}
