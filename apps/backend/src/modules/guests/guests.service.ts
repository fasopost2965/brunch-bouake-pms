import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class GuestsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private auditLogService: AuditLogService,
  ) {}

  async getGuests() {
    return this.prisma.guest.findMany();
  }

  async getGuestById(id: number) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: { documents: true, reservations: true },
    });
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async createGuest(data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const guest = await tx.guest.create({ data });
      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'Guest',
        entityId: guest.id,
        newValues: guest,
      });
      return guest;
    });
  }

  async updateGuest(id: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.guest.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('Guest not found');

      const guest = await tx.guest.update({ where: { id }, data });
      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPDATE',
        entityType: 'Guest',
        entityId: guest.id,
        oldValues: old,
        newValues: guest,
      });
      return guest;
    });
  }

  async uploadDocument(guestId: number, file: Express.Multer.File, type: any, adminId: number) {
    // We check if guest exists
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) throw new NotFoundException('Guest not found');

    // We use the abstract StorageService to upload the file
    const storageUrl = await this.storageService.uploadDocument(file);

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.guestDocument.create({
        data: {
          guestId,
          type,
          storageUrl,
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPLOAD_DOCUMENT',
        entityType: 'GuestDocument',
        entityId: document.id,
        newValues: document,
      });

      return document;
    });
  }
}
