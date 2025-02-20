import { IsArray, IsNotEmpty, IsString } from 'class-validator';

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

export class FindAllRoleDto {
  @IsString()
  name?: string;
}
