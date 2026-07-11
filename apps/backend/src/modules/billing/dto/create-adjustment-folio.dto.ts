import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAdjustmentFolioDto {
  @IsString()
  @IsNotEmpty()
  justification!: string;
}
