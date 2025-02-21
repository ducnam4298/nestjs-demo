import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from '../shared/dtos';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class AssignPermissionsForRole {
  @IsString()
  @IsNotEmpty()
  id!: string;
  @IsArray()
  @IsNotEmpty()
  permissionIds!: string[];
}

export class FindAllRoleDto extends PartialType(PaginationDto) {
  @IsString()
  name?: string;
}
