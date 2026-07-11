import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OccupancyStatus, CleanlinessStatus, TechnicalStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @IsOptional()
  @IsEnum(OccupancyStatus)
  occupancyStatus?: OccupancyStatus;

  @IsOptional()
  @IsEnum(CleanlinessStatus)
  cleanlinessStatus?: CleanlinessStatus;

  @IsOptional()
  @IsEnum(TechnicalStatus)
  technicalStatus?: TechnicalStatus;
}
