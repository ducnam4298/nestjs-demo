import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationRequestDto } from '@/shared/dtos';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  entity: string;

  @IsNotEmpty()
  @IsString()
  roleId: string;
}

export class FindAllPermissionDto extends PartialType(PaginationRequestDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  entity?: string;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
