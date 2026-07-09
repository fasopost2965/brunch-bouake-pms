import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async getRooms() {
    return this.prisma.room.findMany({
      include: { roomType: true },
    });
  }

  async getRoomTypes() {
    return this.prisma.roomType.findMany();
  }

  async getRoomStatuses() {
    return this.prisma.room.findMany({
      select: {
        id: true,
        number: true,
        occupancyStatus: true,
        cleanlinessStatus: true,
        technicalStatus: true,
      },
    });
  }

  async getKpi() {
    const totalPhysical = await this.prisma.room.count();
    const maintenanceRooms = await this.prisma.room.count({
      where: { technicalStatus: 'MAINTENANCE' },
    });
    const availableInventory = totalPhysical - maintenanceRooms;
    
    const occupiedRooms = await this.prisma.room.count({
      where: { occupancyStatus: 'OCCUPIED' },
    });
    
    const occupancyRate = availableInventory > 0 ? (occupiedRooms / availableInventory) * 100 : 0;

    return {
      totalPhysical,
      maintenanceRooms,
      availableInventory,
      occupiedRooms,
      occupancyRate,
    };
  }
}
