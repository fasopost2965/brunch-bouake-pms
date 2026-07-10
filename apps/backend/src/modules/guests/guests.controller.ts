import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GuestsService } from './guests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@Controller('guests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  async getGuests() {
    return this.guestsService.getGuests();
  }

  @Get(':id')
  async getGuestById(@Param('id', ParseIntPipe) id: number) {
    return this.guestsService.getGuestById(id);
  }

  @Post()
  @RequirePermission('guests.write')
  async createGuest(@Request() req: any, @Body() body: any) {
    return this.guestsService.createGuest(body, req.user.sub);
  }

  @Put(':id')
  @RequirePermission('guests.write')
  async updateGuest(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.guestsService.updateGuest(id, body, req.user.sub);
  }

  @Post(':id/documents')
  @RequirePermission('guests.write')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    return this.guestsService.uploadDocument(id, file, type, req.user.sub);
  }
}
