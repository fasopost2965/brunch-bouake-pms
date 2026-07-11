import { IsEnum, IsString, IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FolioLineType } from '@prisma/client';

export class CreateFolioLineDto {
  @IsEnum(FolioLineType)
  type!: FolioLineType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Type(() => Number)
  unitPrice!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}
