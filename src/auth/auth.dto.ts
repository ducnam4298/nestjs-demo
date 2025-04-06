import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Name of the user', example: 'Ngô Đức Nam' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Password for the user', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description:
      'Username of the user (optional, at least one of username, email, or phone must be provided)',
    example: 'ducnam4298',
    required: false,
  })
  @IsString()
  username?: string;

  @ApiProperty({
    description:
      'Email of the user (optional, at least one of username, email, or phone must be provided)',
    example: 'ducnam4298@gmail.com',
    required: false,
  })
  @IsString()
  email?: string;

  @ApiProperty({
    description:
      'Phone number of the user (optional, at least one of username, email, or phone must be provided)',
    example: '0356969828',
    required: false,
  })
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Role ID of the user (optional)',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
    required: false,
  })
  @IsString()
  roleId?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Identifier (either username or email) for login',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Password for the user', example: 'superadmin' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Device ID used for login', example: 'macOSM1' })
  @IsNotEmpty()
  @IsString()
  deviceId: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token for re-authentication',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;

  @ApiProperty({ description: 'Device ID used for refresh token request', example: 'macOSM1' })
  @IsNotEmpty()
  @IsString()
  deviceId: string;
}

export class LogoutDto {
  @ApiProperty({
    description: 'User ID of the user logging out',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Device ID to logout from', example: 'macOSM1' })
  @IsNotEmpty()
  @IsString()
  deviceId: string;
}
