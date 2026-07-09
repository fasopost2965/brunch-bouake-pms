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
}
