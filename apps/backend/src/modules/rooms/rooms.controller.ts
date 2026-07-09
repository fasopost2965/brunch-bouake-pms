import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async getRooms() {
    return this.roomsService.getRooms();
  }

  @Get('types')
  async getRoomTypes() {
    return this.roomsService.getRoomTypes();
  }

  @Get('statuses')
  async getRoomStatuses() {
    return this.roomsService.getRoomStatuses();
  }
}
