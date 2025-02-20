import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

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

export class FindAllPermissionDto {}

export class UpdatePermissionDto {
  @IsString()
  name?: string;

  @IsString()
  entity?: string;

  @IsUUID()
  roleId?: string;
}
