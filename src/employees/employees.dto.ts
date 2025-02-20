import { PartialType } from '@nestjs/mapped-types';
import { Position } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  position!: Position;
}

export class FindAllEmployeeDto {
  @IsString()
  position?: Position;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
