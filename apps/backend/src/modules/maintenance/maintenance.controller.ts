import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('issues')
  async getIssues() {
    return this.maintenanceService.getIssues();
  }

  @Post('issues')
  @RequirePermission('maintenance.write')
  async createIssue(@Request() req: any, @Body() body: any) {
    return this.maintenanceService.createIssue(body, req.user.sub);
  }

  @Put('issues/:id')
  @RequirePermission('maintenance.write')
  async updateIssue(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.maintenanceService.updateIssue(id, body, req.user.sub);
  }
}
