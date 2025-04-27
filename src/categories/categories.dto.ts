import { PaginationRequestDto } from '@/shared';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class Category {}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Parent category associated with the child category',
    example: '',
  })
  @IsUUID()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: 'Array of subCategory IDs to be assigned to the parent category',
    example: [''],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsNotEmpty()
  categoryIds?: string[];

  @ApiProperty({
    description: 'Array of attribute IDs to be assigned to the category',
    example: [''],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsNotEmpty()
  attributeIds?: string[];
}

export class FindAllCategoryDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the category',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
