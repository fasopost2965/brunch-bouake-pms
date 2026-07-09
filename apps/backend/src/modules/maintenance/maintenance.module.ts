import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [MaintenanceService],
  controllers: [MaintenanceController],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
