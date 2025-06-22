import { IsOptional, IsString } from 'class-validator';

export class BaseFiltersDto {
  @IsOptional()
  @IsString()
  page?: number;

  @IsOptional()
  @IsString()
  limit?: number;
}
