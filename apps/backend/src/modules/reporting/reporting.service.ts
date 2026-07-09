import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private prisma: PrismaService) {}

  async getDailySnapshot(dateStr: string) {
    const date = new Date(dateStr);
    
    // Check if it's today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date.getTime() >= today.getTime()) {
      return this.calculateTodaySnapshot();
    }
    
    // Past date -> fetch from DB
    const snapshot = await this.prisma.dailySnapshot.findUnique({
      where: { date },
    });
    
    if (snapshot) return snapshot;
    
    // Fallback if not found
    return {
      date,
      occupiedRooms: 0,
      availableRooms: 0,
      accommodationRevenue: 0,
      adr: 0,
      revPar: 0,
    };
  }

  async calculateTodaySnapshot() {
    const totalPhysical = await this.prisma.room.count();
    const maintenanceRooms = await this.prisma.room.count({
      where: { technicalStatus: 'MAINTENANCE' },
    });
    const availableRooms = totalPhysical - maintenanceRooms;
    
    const occupiedRooms = await this.prisma.room.count({
      where: { occupancyStatus: 'OCCUPIED' },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const agg = await this.prisma.folioLine.aggregate({
      where: {
        type: 'ACCOMMODATION',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const accommodationRevenue = parseFloat((agg._sum.amount || 0).toString());
    const adr = occupiedRooms > 0 ? accommodationRevenue / occupiedRooms : 0;
    const revPar = availableRooms > 0 ? accommodationRevenue / availableRooms : 0;

    return {
      date: startOfDay,
      occupiedRooms,
      availableRooms,
      accommodationRevenue,
      adr,
      revPar,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runNightAudit() {
    this.logger.log('Starting Night Audit...');

    // 1. Calculate and save snapshot for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Calculate for yesterday (using yesterday's dates for revenue)
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const totalPhysical = await this.prisma.room.count();
    const maintenanceRooms = await this.prisma.room.count({
      where: { technicalStatus: 'MAINTENANCE' },
    });
    const availableRooms = totalPhysical - maintenanceRooms;
    
    const occupiedRooms = await this.prisma.room.count({
      where: { occupancyStatus: 'OCCUPIED' },
    });

    const agg = await this.prisma.folioLine.aggregate({
      where: {
        type: 'ACCOMMODATION',
        createdAt: {
          gte: yesterday,
          lte: endOfYesterday,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const accommodationRevenue = parseFloat((agg._sum.amount || 0).toString());
    const adr = occupiedRooms > 0 ? accommodationRevenue / occupiedRooms : 0;
    const revPar = availableRooms > 0 ? accommodationRevenue / availableRooms : 0;

    await this.prisma.dailySnapshot.upsert({
      where: { date: yesterday },
      update: {
        occupiedRooms,
        availableRooms,
        accommodationRevenue,
        adr,
        revPar,
      },
      create: {
        date: yesterday,
        occupiedRooms,
        availableRooms,
        accommodationRevenue,
        adr,
        revPar,
      },
    });
    
    this.logger.log(`Snapshot for ${yesterday.toISOString()} created.`);

    // 2. Mark NO_SHOW reservations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const noShows = await this.prisma.reservation.updateMany({
      where: {
        status: 'CONFIRMED',
        checkInDate: {
          lt: today,
        },
      },
      data: {
        status: 'NO_SHOW',
      },
    });

    this.logger.log(`Marked ${noShows.count} reservations as NO_SHOW.`);
    this.logger.log('Night Audit completed.');
  }
}
