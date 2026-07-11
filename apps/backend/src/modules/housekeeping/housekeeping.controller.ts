import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingTaskDto } from './dto/update-housekeeping-task.dto';
@Controller('housekeeping')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Get('tasks')
  async getTasks() {
    return this.housekeepingService.getTasks();
  }

  @Post('tasks')
  @RequirePermission('housekeeping.write')
  async createTask(@Request() req: any, @Body() body: CreateHousekeepingTaskDto) {
    return this.housekeepingService.createTask(body, req.user.sub);
  }

  @Put('tasks/:id')
  @RequirePermission('housekeeping.write')
  async updateTask(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateHousekeepingTaskDto) {
    return this.housekeepingService.updateTask(id, body, req.user.sub);
  }
}
