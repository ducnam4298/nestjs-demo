import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Name of the role',
    example: 'Admin',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class AssignPermissionsForRole {
  @ApiProperty({
    description: 'ID of the role',
    example: '1a2b3c4d',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Array of permission IDs to be assigned to the role',
    example: ['1a2b3c4d', '5e6f7g8h'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  permissionIds: string[];
}

export class FindAllRoleDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the role to filter by (optional)',
    example: 'Admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
