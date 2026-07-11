import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { IdType } from '@prisma/client';

export class CreateGuestDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  phone?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEnum(IdType)
  idType?: IdType | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  idNumber?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  nationality?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  notes?: string | null;
}
