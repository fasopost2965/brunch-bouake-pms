import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [StorageModule, AuditLogModule],
  providers: [GuestsService],
  controllers: [GuestsController],
  exports: [GuestsService],
})
export class GuestsModule {}
