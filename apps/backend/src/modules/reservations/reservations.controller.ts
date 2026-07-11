import { Controller, Get, Post, Put, Patch, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateTaxExemptionDto } from './dto/update-tax-exemption.dto';
import { CheckInDto } from './dto/check-in.dto';
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
  @RequirePermission('reservations.create')
  async createReservation(@Request() req: any, @Body() body: CreateReservationDto) {
    return this.reservationsService.createReservation(body, req.user.sub);
  }

  @Put(':id')
  @RequirePermission('reservations.write')
  async updateReservation(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateReservationDto) {
    return this.reservationsService.updateReservation(id, body, req.user.sub);
  }

  @Patch(':id/tax-exemption')
  @RequirePermission('reservation.tax_exempt')
  async updateTaxExemption(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateTaxExemptionDto) {
    return this.reservationsService.updateTaxExemption(id, body.taxExempt, body.taxExemptReason ?? '', req.user.sub);
  }

  @Post(':id/checkin')
  @RequirePermission('reservations.checkin')
  async checkIn(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CheckInDto) {
    return this.reservationsService.checkIn(id, body.override || false, body.overrideReason ?? '', req.user.sub);
  }

  @Post(':id/checkout')
  @RequirePermission('reservations.checkout')
  async checkOut(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.checkOut(id, req.user.sub);
  }
}
