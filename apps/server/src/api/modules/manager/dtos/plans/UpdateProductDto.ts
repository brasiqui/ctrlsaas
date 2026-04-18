import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['api', 'web', 'service'])
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
