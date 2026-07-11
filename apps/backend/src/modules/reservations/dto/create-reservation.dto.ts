import { IsInt, Min, IsDateString, IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BookingSource } from '@prisma/client';

export class CreateReservationDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  guestId!: number;

  @IsDateString()
  checkInDate!: string;

  @IsDateString()
  checkOutDate!: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' || value === null || value === undefined) ? undefined : parseInt(value, 10))
  roomId?: number;

  @IsNumber()
  @Type(() => Number)
  agreedRate!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  adultsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  childrenCount?: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsEnum(BookingSource)
  source?: BookingSource;
}
