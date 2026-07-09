import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@Controller('reservations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  async getReservations() {
    return this.reservationsService.getReservations();
  }

  @Get(':id')
  async getReservationById(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.getReservationById(id);
  }

  @Post()
  @RequirePermission('reservations.write')
  async createReservation(@Request() req: any, @Body() body: any) {
    return this.reservationsService.createReservation(body, req.user.sub);
  }

  @Put(':id')
  @RequirePermission('reservations.write')
  async updateReservation(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.reservationsService.updateReservation(id, body, req.user.sub);
  }

  @Post(':id/checkin')
  @RequirePermission('reservations.write')
  async checkIn(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.reservationsService.checkIn(id, body.override || false, body.overrideReason, req.user.sub);
  }

  @Post(':id/checkout')
  @RequirePermission('reservations.write')
  async checkOut(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.checkOut(id, req.user.sub);
  }
}
