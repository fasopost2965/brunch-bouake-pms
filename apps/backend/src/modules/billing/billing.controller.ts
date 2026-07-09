import { Controller, Post, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('folios/:id/lines')
  @RequirePermission('billing.write')
  async addFolioLine(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.billingService.addFolioLine(id, body, req.user.sub);
  }

  @Post('folios/:id/payments')
  @RequirePermission('billing.write')
  async addPayment(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.billingService.addPayment(id, body, req.user.sub);
  }

  @Post('folios/:id/close')
  @RequirePermission('billing.write')
  async closeFolio(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.billingService.closeFolio(id, body.override || false, body.overrideReason, req.user.sub);
  }

  @Post('reservations/:id/folios/adjustment')
  @RequirePermission('billing.adjustment.create')
  async createAdjustmentFolio(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.billingService.createAdjustmentFolio(id, body.justification, req.user.sub);
  }
}
