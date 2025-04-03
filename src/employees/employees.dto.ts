import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Position } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Position of the employee',
    example: 'Developer',
  })
  @IsNotEmpty()
  @IsString()
  position: Position;
}

export class FindAllEmployeeDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Position of the employee (optional)',
    example: 'Developer',
    required: false,
  })
  @IsOptional()
  @IsString()
  position?: Position;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
