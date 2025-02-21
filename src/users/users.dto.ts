import { PartialType } from '@nestjs/mapped-types';
import { StatusUser } from '@prisma/client';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../shared/dtos';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsString()
  roleId?: string;
}

export class FindAllUserDto extends PartialType(PaginationDto) {
  @IsString()
  name?: string;

  @IsString()
  email?: string;

  @IsString()
  phone?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: StatusUser;
}

export class UpdateUserRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}

export class ActivationDto {
  @IsBoolean()
  @IsOptional()
  activate?: boolean;
}
