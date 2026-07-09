import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class HousekeepingService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async getTasks() {
    return this.prisma.housekeepingTask.findMany({
      include: { room: true, assignedTo: true, reportedBy: true },
    });
  }

  async createTask(data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      if (data.type === 'INSPECTION' && data.status === 'DONE' && !data.inspectionResult) {
        throw new BadRequestException('inspectionResult is required for completed INSPECTION tasks.');
      }

      const task = await tx.housekeepingTask.create({
        data: {
          ...data,
          reportedById: adminId,
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'HousekeepingTask',
        entityId: task.id,
        newValues: task,
      });

      await this.handleRoomStatusUpdate(tx, task);

      return task;
    });
  }

  async updateTask(id: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.housekeepingTask.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('HousekeepingTask not found');

      const isCompletedNow = data.status === 'DONE';
      const isInspection = old.type === 'INSPECTION';

      if (isInspection && isCompletedNow && !data.inspectionResult && !old.inspectionResult) {
        throw new BadRequestException('inspectionResult is required to complete an INSPECTION task.');
      }

      const task = await tx.housekeepingTask.update({ where: { id }, data });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPDATE',
        entityType: 'HousekeepingTask',
        entityId: task.id,
        oldValues: old,
        newValues: task,
      });

      if (old.status !== 'DONE' && task.status === 'DONE') {
        await this.handleRoomStatusUpdate(tx, task);
      }

      return task;
    });
  }

  private async handleRoomStatusUpdate(tx: any, task: any) {
    if (task.status !== 'DONE') return;

    let newCleanlinessStatus = null;

    if (task.type === 'CHECKOUT_CLEAN' || task.type === 'STAYOVER_CLEAN' || task.type === 'DEEP_CLEAN') {
      newCleanlinessStatus = 'CLEAN';
    } else if (task.type === 'INSPECTION') {
      newCleanlinessStatus = task.inspectionResult;
    }

    if (newCleanlinessStatus) {
      await tx.room.update({
        where: { id: task.roomId },
        data: { cleanlinessStatus: newCleanlinessStatus },
      });
    }
  }
}
