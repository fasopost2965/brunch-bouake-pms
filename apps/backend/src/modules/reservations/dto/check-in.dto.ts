import { IsBoolean, IsString, IsNotEmpty, ValidateIf, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsBoolean()
  override?: boolean;

  @ValidateIf((o) => o.override === true)
  @IsString()
  @IsNotEmpty()
  overrideReason?: string;
}
