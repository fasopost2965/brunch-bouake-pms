import { IsInt, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { HousekeepingType, TaskPriority } from '@prisma/client';

export class CreateHousekeepingTaskDto {
  @IsInt()
  @Type(() => Number)
  roomId!: number;

  @IsEnum(HousekeepingType)
  type!: HousekeepingType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  assignedToId?: number;
}
