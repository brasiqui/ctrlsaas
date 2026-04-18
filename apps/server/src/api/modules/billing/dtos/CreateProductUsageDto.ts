import { IsNotEmpty, IsUUID, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductUsageDto {
  @IsNotEmpty()
  @IsUUID()
  subscriptionId!: string;

  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsString()
  metric!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  usedValue!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limitValue?: number;
}
