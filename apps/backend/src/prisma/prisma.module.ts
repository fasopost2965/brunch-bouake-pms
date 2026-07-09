// ============================================================
// Brunch Bouaké PMS — Prisma Module
// ============================================================
// Global module — imported once in AppModule, available everywhere.

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
