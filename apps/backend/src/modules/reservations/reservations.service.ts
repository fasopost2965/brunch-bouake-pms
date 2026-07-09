import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async getReservations() {
    return this.prisma.reservation.findMany({
      include: { guest: true, room: true },
    });
  }

  async getReservationById(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { guest: true, room: true, statusHistory: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  // Helper for logging status history
  private async logStatusHistory(tx: Prisma.TransactionClient, reservationId: number, fromStatus: any, toStatus: any, reason: string | null, userId: number) {
    if (fromStatus === toStatus) return;
    await tx.reservationStatusHistory.create({
      data: {
        reservationId,
        fromStatus,
        toStatus,
        reason,
        changedById: userId,
      },
    });
  }

  // --- Règle 7.2 (Anti-chevauchement) ---
  private async checkOverlap(tx: Prisma.TransactionClient, roomId: number, checkIn: Date, checkOut: Date, excludeReservationId?: number) {
    // Pose d'un verrou exclusif sur la chambre pour sérialiser les réservations
    await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${roomId} FOR UPDATE`;

    const whereClause: any = {
      roomId,
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    };

    if (excludeReservationId) {
      whereClause.id = { not: excludeReservationId };
    }

    const overlaps = await tx.reservation.findFirst({
      where: whereClause,
    });

    if (overlaps) {
      throw new ConflictException('La chambre est déjà réservée pour ces dates.');
    }
  }

  async createReservation(data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const checkInDate = new Date(data.checkInDate);
      const checkOutDate = new Date(data.checkOutDate);

      if (data.roomId) {
        await this.checkOverlap(tx, data.roomId, checkInDate, checkOutDate);
      }

      const reservation = await tx.reservation.create({
        data: {
          ...data,
          createdById: adminId,
          folios: {
            create: {
              type: 'MAIN',
              status: 'OPEN',
            },
          },
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'Reservation',
        entityId: reservation.id,
        newValues: reservation,
      });

      await this.logStatusHistory(tx, reservation.id, 'PENDING', data.status || 'PENDING', 'Creation', adminId);

      return reservation;
    });
  }

  async updateReservation(id: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.reservation.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('Reservation not found');

      const checkInDate = data.checkInDate ? new Date(data.checkInDate) : old.checkInDate;
      const checkOutDate = data.checkOutDate ? new Date(data.checkOutDate) : old.checkOutDate;
      const roomId = data.roomId !== undefined ? data.roomId : old.roomId;

      if (roomId) {
        await this.checkOverlap(tx, roomId, checkInDate, checkOutDate, id);
      }

      const reservation = await tx.reservation.update({ where: { id }, data });

      if (old.status !== reservation.status) {
        await this.logStatusHistory(tx, reservation.id, old.status, reservation.status, 'Modification', adminId);
      }

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPDATE',
        entityType: 'Reservation',
        entityId: reservation.id,
        oldValues: old,
        newValues: reservation,
      });
      return reservation;
    });
  }

  async updateTaxExemption(id: number, taxExempt: boolean, taxExemptReason: string, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.reservation.findUnique({ where: { id }, include: { folios: true } });
      if (!old) throw new NotFoundException('Reservation not found');

      if (taxExempt && (!taxExemptReason || taxExemptReason.trim() === '')) {
        throw new BadRequestException('Un motif explicite et non vide est obligatoire pour accorder une exemption de taxe.');
      }

      // If no change, return early
      if (old.taxExempt === taxExempt) {
        return old;
      }

      const reservation = await tx.reservation.update({
        where: { id },
        data: {
          taxExempt,
          taxExemptReason: taxExempt ? taxExemptReason : null,
        }
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'UPDATE_TAX_EXEMPTION',
        entityType: 'Reservation',
        entityId: reservation.id,
        oldValues: { taxExempt: old.taxExempt, taxExemptReason: old.taxExemptReason },
        newValues: { taxExempt, taxExemptReason: reservation.taxExemptReason },
      });

      // Handle existing TAX lines if taxExempt became true
      if (taxExempt) {
        for (const folio of old.folios) {
          if (folio.status === 'OPEN') {
            // Delete TAX lines from open folios
            await tx.folioLine.deleteMany({
              where: {
                folioId: folio.id,
                type: 'TAX'
              }
            });
          } else if (folio.status === 'CLOSED') {
            // Check if there are TAX lines in this closed folio
            const taxLines = await tx.folioLine.findMany({
              where: { folioId: folio.id, type: 'TAX' }
            });

            if (taxLines.length > 0) {
              const totalTax = taxLines.reduce((acc, line) => acc + parseFloat(line.amount.toString()), 0);
              
              if (totalTax > 0) {
                // Create an ADJUSTMENT folio automatically
                const adjFolio = await tx.folio.create({
                  data: {
                    reservationId: id,
                    parentFolioId: folio.id,
                    type: 'ADJUSTMENT',
                    status: 'OPEN',
                  }
                });
                
                // Add negative adjustment line
                await tx.folioLine.create({
                  data: {
                    folioId: adjFolio.id,
                    type: 'TAX',
                    description: `Annulation taxe (Exemption accordée : ${taxExemptReason})`,
                    unitPrice: -totalTax,
                    quantity: 1,
                    amount: -totalTax,
                    isAdjustment: true
                  }
                });
              }
            }
          }
        }
      }

      return reservation;
    });
  }

  // --- Règle 7.3 Check-in ---
  async checkIn(id: number, override: boolean, overrideReason: string, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id }, include: { room: true } });
      if (!reservation) throw new NotFoundException('Reservation not found');

      if (!reservation.roomId || !reservation.room) {
        throw new BadRequestException('Aucune chambre assignée à cette réservation.');
      }

      const room = reservation.room;
      const isClean = room.cleanlinessStatus === 'CLEAN';
      const isOperational = room.technicalStatus === 'OPERATIONAL';

      if (!isClean || !isOperational) {
        if (!override) {
          throw new BadRequestException('La chambre n\'est pas prête pour le check-in (doit être CLEAN et OPERATIONAL). Override requis.');
        }
        if (!overrideReason) {
          throw new BadRequestException('Une justification (overrideReason) est obligatoire en cas de forçage du check-in.');
        }
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
      });

      // Update room occupancy status
      await tx.room.update({
        where: { id: room.id },
        data: { occupancyStatus: 'OCCUPIED' },
      });

      await this.logStatusHistory(tx, id, reservation.status, 'CHECKED_IN', override ? `OVERRIDE: ${overrideReason}` : 'Standard Check-in', adminId);

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CHECK_IN',
        entityType: 'Reservation',
        entityId: id,
        oldValues: { status: reservation.status },
        newValues: { status: 'CHECKED_IN', overrideUsed: override, overrideReason },
      });

      return updated;
    });
  }

  // --- Check-out ---
  async checkOut(id: number, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id }, include: { room: true } });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (reservation.status !== 'CHECKED_IN') throw new BadRequestException('Reservation is not CHECKED_IN');

      const updated = await tx.reservation.update({
        where: { id },
        data: { status: 'CHECKED_OUT' },
      });

      if (reservation.roomId) {
        // Change room to DIRTY and VACANT
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { occupancyStatus: 'VACANT', cleanlinessStatus: 'DIRTY' },
        });
      }

      await this.logStatusHistory(tx, id, reservation.status, 'CHECKED_OUT', 'Standard Check-out', adminId);

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CHECK_OUT',
        entityType: 'Reservation',
        entityId: id,
        oldValues: { status: reservation.status },
        newValues: { status: 'CHECKED_OUT' },
      });

      return updated;
    });
  }
}
