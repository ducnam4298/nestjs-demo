import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Entity associated with the permission',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  entity: string;

  @ApiProperty({
    description: 'Role ID associated with the permission',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  roleId: string;
}

export class FindAllPermissionDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the permission (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Entity associated with the permission (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;
}

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Entity associated with the permission (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({
    description: 'Role ID associated with the permission (optional)',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}
