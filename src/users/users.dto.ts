import { PartialType } from '@nestjs/mapped-types';
import { StatusUser } from '@prisma/client';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/shared/dtos';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsString()
  roleId?: string;
}

export class FindAllUserDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class FindOneUserDto {
  @IsString()
  @IsEmail()
  email?: string;

  @IsString()
  phone?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(Object.values(StatusUser))
  @IsString()
  status?: StatusUser;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status?: StatusUser;
}

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsString()
  roleId?: string;
}

export class ActivationDto {
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}
