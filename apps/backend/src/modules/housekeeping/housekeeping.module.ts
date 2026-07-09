import { Module } from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { HousekeepingController } from './housekeeping.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [HousekeepingService],
  controllers: [HousekeepingController],
  exports: [HousekeepingService],
})
export class HousekeepingModule {}
