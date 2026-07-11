import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { IssueSeverity, MaintenanceStatus } from '@prisma/client';

export class UpdateMaintenanceIssueDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  assignedToId?: number;
}
