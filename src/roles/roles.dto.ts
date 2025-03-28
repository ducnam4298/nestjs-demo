import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared/dtos';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class AssignPermissionsForRole {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsArray()
  @IsNotEmpty()
  permissionIds: string[];
}

export class FindAllRoleDto extends PartialType(PaginationRequestDto) {
  @IsOptional()
  @IsString()
  name?: string;
}
