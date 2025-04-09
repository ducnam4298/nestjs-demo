import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto, StatusUser } from '@/shared';

export class CreateUserDto {
  @ApiProperty({
    description: 'Name of the user',
    example: 'Ngô Đức Nam',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'ducnam4298@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '0356969828',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Role ID of the user (optional)',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
    required: false,
  })
  @IsString()
  roleId?: string;
}

export class FindAllUserDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the user to filter by (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Email of the user to filter by (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the user to filter by (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class FindOneUserDto {
  @ApiProperty({
    description: 'Email of the user (optional)',
    example: 'ducnam4298@gmail.com',
    required: false,
  })
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the user (optional)',
    example: '0356969828',
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
    enum: StatusUser,
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
    enum: StatusUser,
  })
  @IsString()
  @IsNotEmpty()
  status?: StatusUser;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Role ID to be updated for the user',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
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
