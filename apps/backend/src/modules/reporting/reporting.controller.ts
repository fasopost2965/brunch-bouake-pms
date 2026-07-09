import { Controller, Get, Query, UseGuards, Post } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('snapshot')
  @RequirePermission('reports.read')
  async getSnapshot(@Query('date') date: string) {
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }
    return this.reportingService.getDailySnapshot(date);
  }

  // Endpoints existants fusionnés via snapshot pour simplifier la lecture
  @Get('occupancy')
  @RequirePermission('reports.read')
  async getOccupancy(@Query('date') date: string) {
    if (!date) date = new Date().toISOString().split('T')[0];
    const snapshot = await this.reportingService.getDailySnapshot(date);
    return { occupancyRate: snapshot.availableRooms > 0 ? (snapshot.occupiedRooms / snapshot.availableRooms) * 100 : 0 };
  }

  @Get('adr')
  @RequirePermission('reports.read')
  async getAdr(@Query('date') date: string) {
    if (!date) date = new Date().toISOString().split('T')[0];
    const snapshot = await this.reportingService.getDailySnapshot(date);
    return { adr: snapshot.adr };
  }

  @Get('revpar')
  @RequirePermission('reports.read')
  async getRevpar(@Query('date') date: string) {
    if (!date) date = new Date().toISOString().split('T')[0];
    const snapshot = await this.reportingService.getDailySnapshot(date);
    return { revPar: snapshot.revPar };
  }

  @Post('night-audit')
  @RequirePermission('reports.write') // Used for testing
  async triggerNightAudit() {
    await this.reportingService.runNightAudit();
    return { success: true, message: 'Night Audit completed' };
  }
}
