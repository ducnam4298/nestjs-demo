import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsString()
  username?: string;

  @IsString()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  roleId?: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;

  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}

export class LogoutDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}
