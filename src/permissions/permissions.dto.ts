import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission',
    example: 'Create',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Entity associated with the permission',
    example: 'USER',
  })
  @IsNotEmpty()
  @IsString()
  entity: string;

  @ApiProperty({
    description: 'Role ID associated with the permission',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
  })
  @IsNotEmpty()
  @IsString()
  roleId: string;
}

export class FindAllPermissionDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the permission (optional)',
    example: 'Create',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Entity associated with the permission (optional)',
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;
}

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission (optional)',
    example: 'Update',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Entity associated with the permission (optional)',
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({
    description: 'Role ID associated with the permission (optional)',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}
