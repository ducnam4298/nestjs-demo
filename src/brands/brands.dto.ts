import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Name of the brand',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
  @ApiProperty({
    description: 'Logo url of the brand',
    example: '',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({
    description: 'Array of product IDs to be assigned to the brand',
    example: [''],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsNotEmpty()
  productIds?: string[];
}

export class FindAllBrandDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the brand',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Logo url of the brand',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({
    description: 'Array of product IDs to be assigned to the brand',
    example: [''],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsNotEmpty()
  productIds?: string[];
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
