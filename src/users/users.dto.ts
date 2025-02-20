import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}

export class FindAllUserDto {
  @IsString()
  name?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
