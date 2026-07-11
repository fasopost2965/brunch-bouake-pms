import { IsInt, IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { IssueSeverity } from '@prisma/client';

export class CreateMaintenanceIssueDto {
  @IsInt()
  @Type(() => Number)
  roomId!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;
}
