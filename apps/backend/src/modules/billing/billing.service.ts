import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private async calculateBalance(tx: any, folioId: number) {
    const lines = await tx.folioLine.findMany({ where: { folioId } });
    const payments = await tx.payment.findMany({ where: { folioId, status: 'COMPLETED' } });

    const totalCharges = lines.reduce((acc: number, line: any) => acc + (parseFloat(line.amount) * line.quantity), 0);
    const totalPaid = payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0);
    const balanceDue = totalCharges - totalPaid;

    await tx.folio.update({
      where: { id: folioId },
      data: { balanceDue },
    });

    return balanceDue;
  }

  async addFolioLine(folioId: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId }, include: { reservation: true } });
      if (!folio) throw new NotFoundException('Folio not found');
      if (folio.status === 'CLOSED') throw new ForbiddenException('Cannot modify a closed folio');

      let unitPrice = data.unitPrice;
      let amount = data.amount;

      if (data.type === 'ACCOMMODATION') {
        unitPrice = folio.reservation.agreedRate;
        amount = unitPrice;
      }

      const line = await tx.folioLine.create({
        data: {
          ...data,
          folioId,
          unitPrice,
          amount,
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'FolioLine',
        entityId: line.id,
        newValues: line,
      });

      await this.calculateBalance(tx, folioId);

      return line;
    });
  }

  async addPayment(folioId: number, data: any, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException('Folio not found');
      if (folio.status === 'CLOSED') throw new ForbiddenException('Cannot modify a closed folio');

      const payment = await tx.payment.create({
        data: {
          ...data,
          folioId,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'Payment',
        entityId: payment.id,
        newValues: payment,
      });

      await this.calculateBalance(tx, folioId);

      return payment;
    });
  }

  async closeFolio(folioId: number, override: boolean, overrideReason: string, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException('Folio not found');
      if (folio.status === 'CLOSED') throw new BadRequestException('Folio is already closed');

      const balance = await this.calculateBalance(tx, folioId);

      if (balance !== 0 && !override) {
        throw new BadRequestException('Balance is not zero. Override required to close.');
      }
      if (balance !== 0 && override && !overrideReason) {
        throw new BadRequestException('overrideReason is required to force close a folio with non-zero balance.');
      }

      const closedFolio = await tx.folio.update({
        where: { id: folioId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      // Generate Invoice
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const legalNumber = `INV-${dateStr}-${folioId.toString().padStart(4, '0')}`;
      
      const invoice = await tx.invoice.create({
        data: {
          folioId,
          legalNumber,
          issuedAt: new Date(),
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CLOSE',
        entityType: 'Folio',
        entityId: folioId,
        newValues: { status: 'CLOSED', override, overrideReason, legalNumber },
      });

      return { closedFolio, invoice };
    });
  }

  async createAdjustmentFolio(reservationId: number, justification: string, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const mainFolio = await tx.folio.findFirst({
        where: { reservationId, type: 'MAIN' },
      });

      if (!mainFolio) {
        throw new NotFoundException('Main folio not found for this reservation');
      }

      const adjFolio = await tx.folio.create({
        data: {
          reservationId,
          type: 'ADJUSTMENT',
          parentFolioId: mainFolio.id,
          status: 'OPEN',
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE_ADJUSTMENT',
        entityType: 'Folio',
        entityId: adjFolio.id,
        newValues: { ...adjFolio, justification },
      });

      return adjFolio;
    });
  }
}
