import { IsBoolean, IsString, IsNotEmpty, ValidateIf } from 'class-validator';

export class UpdateTaxExemptionDto {
  @IsBoolean()
  taxExempt!: boolean;

  @ValidateIf((o) => o.taxExempt === true)
  @IsString()
  @IsNotEmpty()
  taxExemptReason?: string;
}
