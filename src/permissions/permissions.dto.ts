import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission',
    example: 'CreateUser',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Entity associated with the permission',
    example: 'User',
  })
  @IsNotEmpty()
  @IsString()
  entity: string;

  @ApiProperty({
    description: 'Role ID associated with the permission',
    example: '12345',
  })
  @IsNotEmpty()
  @IsString()
  roleId: string;
}

export class FindAllPermissionDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the permission (optional)',
    example: 'CreateUser',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Entity associated with the permission (optional)',
    example: 'User',
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;
}

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission (optional)',
    example: 'UpdateUser',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Entity associated with the permission (optional)',
    example: 'User',
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({
    description: 'Role ID associated with the permission (optional)',
    example: '67890',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}
