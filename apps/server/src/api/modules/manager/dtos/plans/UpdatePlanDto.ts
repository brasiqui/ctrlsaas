import { IsOptional, IsString, IsUUID, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanFeatures } from '@fnd/domain';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsObject()
  //@ValidateNested()
  @Type(() => Object)
  features?: PlanFeatures;
}
