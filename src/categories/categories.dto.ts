import { PaginationRequestDto } from '@/shared';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class Category {}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Create',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Parent category associated with the child category',
    example: 'e6678934-0ab8-4cbe-af40-beae958e9270',
  })
  @IsUUID()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: 'Array of subCategory IDs to be assigned to the parent category',
    example: ['e6678934-0ab8-4cbe-af40-beae958e9270', 'e6678934-0ab8-4cbe-af40-beae958e9270'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsNotEmpty()
  categoryIds?: string[];
}

export class FindAllCategoryDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Create',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
