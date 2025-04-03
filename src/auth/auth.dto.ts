import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
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
    example: 'johndoe',
    required: false,
  })
  @IsString()
  username?: string;

  @ApiProperty({
    description:
      'Email of the user (optional, at least one of username, email, or phone must be provided)',
    example: 'johndoe@example.com',
    required: false,
  })
  @IsString()
  email?: string;

  @ApiProperty({
    description:
      'Phone number of the user (optional, at least one of username, email, or phone must be provided)',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Role ID of the user (optional)', example: 'admin', required: false })
  @IsString()
  roleId?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Identifier (either username or email) for login',
    example: 'johnDoe',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Password for the user', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Device ID used for login', example: 'device1234' })
  @IsNotEmpty()
  @IsString()
  deviceId: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token for re-authentication', example: 'refreshToken123' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;

  @ApiProperty({ description: 'Device ID used for refresh token request', example: 'device1234' })
  @IsNotEmpty()
  @IsString()
  deviceId: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'User ID of the user logging out', example: 'user123' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Device ID to logout from', example: 'device1234' })
  @IsNotEmpty()
  @IsString()
  deviceId: string;
}
