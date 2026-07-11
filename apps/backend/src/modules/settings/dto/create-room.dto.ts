import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsInt()
  @Type(() => Number)
  roomTypeId!: number;

  @IsInt()
  @Type(() => Number)
  floor!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
