import { IsNotEmpty, IsString, IsObject, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanFeatures } from '@fnd/domain';

export class CreatePlanDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsObject()
  //@ValidateNested()
  @Type(() => Object)
  features!: PlanFeatures;
}
