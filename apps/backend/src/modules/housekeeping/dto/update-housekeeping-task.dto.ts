import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { HousekeepingStatus, TaskPriority, CleanlinessStatus } from '@prisma/client';

export class UpdateHousekeepingTaskDto {
  @IsOptional()
  @IsEnum(HousekeepingStatus)
  status?: HousekeepingStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(CleanlinessStatus)
  inspectionResult?: CleanlinessStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
