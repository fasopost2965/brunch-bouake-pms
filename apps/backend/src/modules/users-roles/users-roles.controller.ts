import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersRolesService } from './users-roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@Controller('users-roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersRolesController {
  constructor(private readonly usersRolesService: UsersRolesService) {}

  @Post('users')
  @RequirePermission('users.create')
  async createUser(@Request() req: any, @Body() body: any) {
    // req.user contains the decoded JWT payload
    return this.usersRolesService.createUser(body, req.user.sub);
  }

  @Get('users')
  async getAllUsers() {
    return this.usersRolesService.getAllUsers();
  }

  @Get('roles')
  async getAllRoles() {
    return this.usersRolesService.getAllRoles();
  }
}
