import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../shared/dtos';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  entity!: string;

  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}

export class FindAllPermissionDto extends PartialType(PaginationDto) {
  @IsString()
  name?: string;

  @IsString()
  entity?: string;
}

export class UpdatePermissionDto {
  @IsString()
  name?: string;

  @IsString()
  entity?: string;

  @IsUUID()
  roleId?: string;
}
