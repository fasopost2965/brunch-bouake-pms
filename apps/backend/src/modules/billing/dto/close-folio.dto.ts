import { IsBoolean, IsOptional, IsString, IsNotEmpty, ValidateIf } from 'class-validator';

export class CloseFolioDto {
  @IsOptional()
  @IsBoolean()
  override?: boolean;

  @ValidateIf((o) => o.override === true)
  @IsString()
  @IsNotEmpty()
  overrideReason?: string;
}
