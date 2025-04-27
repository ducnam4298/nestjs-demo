import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto, Position } from '@/shared';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Position of the employee',
    example: '',
    enum: Position,
  })
  @IsNotEmpty()
  @IsString()
  position: Position;
}

export class FindAllEmployeeDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Position of the employee (optional)',
    example: '',
    required: false,
    enum: Position,
  })
  @IsOptional()
  @IsString()
  position?: Position;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
