import { Module } from '@nestjs/common';
import { UsersRolesService } from './users-roles.service';
import { UsersRolesController } from './users-roles.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [UsersRolesService],
  controllers: [UsersRolesController],
  exports: [UsersRolesService],
})
export class UsersRolesModule {}
