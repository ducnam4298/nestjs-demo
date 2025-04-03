import { ApiProperty, PartialType } from '@nestjs/swagger';
import { StatusUser } from '@prisma/client';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreateUserDto {
  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@example.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Role ID of the user (optional)',
    example: 'role-id-123',
    required: false,
  })
  @IsString()
  roleId?: string;
}

export class FindAllUserDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the user to filter by (optional)',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Email of the user to filter by (optional)',
    example: 'johndoe@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the user to filter by (optional)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class FindOneUserDto {
  @ApiProperty({
    description: 'Email of the user (optional)',
    example: 'johndoe@example.com',
    required: false,
  })
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the user (optional)',
    example: '1234567890',
    required: false,
  })
  @IsString()
  phone?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'Active status of the user (optional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Status of the user (optional)',
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsIn(Object.values(StatusUser))
  @IsString()
  status?: StatusUser;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Old password of the user',
    example: 'OldPassword123',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New password of the user',
    example: 'NewPassword123',
  })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Status to be updated for the user',
    example: 'INACTIVE',
  })
  @IsString()
  @IsNotEmpty()
  status?: StatusUser;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Role ID to be updated for the user',
    example: 'role-id-456',
  })
  @IsNotEmpty()
  @IsString()
  roleId?: string;
}

export class ActivationDto {
  @ApiProperty({
    description: 'Activate or deactivate the user',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}
