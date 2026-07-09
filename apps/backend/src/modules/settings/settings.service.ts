import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  // --- Room Types ---
  async getRoomTypes() {
    return this.prisma.roomType.findMany();
  }

  async createRoomType(data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const roomType = await tx.roomType.create({ data });
      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'RoomType',
        entityId: roomType.id,
        newValues: roomType,
      });
      return roomType;
    });
  }

  async updateRoomType(id: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.roomType.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('RoomType not found');

      const roomType = await tx.roomType.update({ where: { id }, data });
      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPDATE',
        entityType: 'RoomType',
        entityId: roomType.id,
        oldValues: old,
        newValues: roomType,
      });
      return roomType;
    });
  }

  // --- Rooms ---
  async getRooms() {
    return this.prisma.room.findMany({ include: { roomType: true } });
  }

  async createRoom(data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({ data });
      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'Room',
        entityId: room.id,
        newValues: room,
      });
      return room;
    });
  }

  async updateRoom(id: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.room.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('Room not found');

      const room = await tx.room.update({ where: { id }, data });
      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPDATE',
        entityType: 'Room',
        entityId: room.id,
        oldValues: old,
        newValues: room,
      });
      return room;
    });
  }
}
