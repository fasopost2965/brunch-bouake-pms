import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  amenities?: any;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity!: number;

  @IsNumber()
  @Type(() => Number)
  baseRate!: number;
}
