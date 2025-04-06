import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Name of the role',
    example: 'USER',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class AssignPermissionsForRole {
  @ApiProperty({
    description: 'ID of the role',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Array of permission IDs to be assigned to the role',
    example: ['e6678934-0ab8-4cbe-af40-beae958e9270', 'e6678934-0ab8-4cbe-af40-beae958e9270'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  permissionIds: string[];
}

export class FindAllRoleDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the role to filter by (optional)',
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
