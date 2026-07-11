import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // --- Room Types ---
  @Get('room-types')
  async getRoomTypes() {
    return this.settingsService.getRoomTypes();
  }

  @Post('room-types')
  @RequirePermission('settings.rooms.write')
  async createRoomType(@Request() req: any, @Body() body: CreateRoomTypeDto) {
    return this.settingsService.createRoomType(body, req.user.sub);
  }

  @Put('room-types/:id')
  @RequirePermission('settings.rooms.write')
  async updateRoomType(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoomTypeDto) {
    return this.settingsService.updateRoomType(id, body, req.user.sub);
  }

  // --- Rooms ---
  @Get('rooms')
  async getRooms() {
    return this.settingsService.getRooms();
  }

  @Post('rooms')
  @RequirePermission('settings.rooms.write')
  async createRoom(@Request() req: any, @Body() body: CreateRoomDto) {
    return this.settingsService.createRoom(body, req.user.sub);
  }

  @Put('rooms/:id')
  @RequirePermission('settings.rooms.write')
  async updateRoom(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoomDto) {
    return this.settingsService.updateRoom(id, body, req.user.sub);
  }
}
