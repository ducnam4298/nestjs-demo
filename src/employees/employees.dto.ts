import { PartialType } from '@nestjs/mapped-types';
import { Position } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/shared/dtos';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  position: Position;
}

export class FindAllEmployeeDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString()
  position?: Position;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
