import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['api', 'web', 'service'])
  type!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
