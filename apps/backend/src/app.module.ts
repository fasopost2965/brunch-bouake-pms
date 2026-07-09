// ============================================
// Brunch Bouaké PMS — Root App Module
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { UsersRolesModule } from './modules/users-roles/users-roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GuestsModule } from './modules/guests/guests.module';
import { ReservationsModule } from './modules/reservations/reservations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    AuditLogModule,
    UsersRolesModule,
    AuthModule,
    StorageModule,
    SettingsModule,
    RoomsModule,
    GuestsModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
