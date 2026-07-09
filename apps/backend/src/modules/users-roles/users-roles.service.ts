import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersRolesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async createUser(data: any, adminId: number): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, firstName, lastName, roleId } = data;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash: passwordHash,
          firstName: firstName,
          lastName: lastName,
          roleId: roleId,
        },
      });

      await this.auditLogService.logAction(tx, {
        userId: adminId,
        action: 'CREATE',
        entityType: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, roleId: newUser.roleId },
      });

      const { passwordHash: _, ...result } = newUser;
      return result as unknown as Omit<User, 'passwordHash'>;
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: { role: true },
    });
    return users.map((user) => {
      const { passwordHash, ...rest } = user;
      return rest;
    });
  }
}
