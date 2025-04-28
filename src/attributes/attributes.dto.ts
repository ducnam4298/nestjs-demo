import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DataTypeAttribute, PaginationRequestDto } from '@/shared';

export class CreateAttributeDto {
  @ApiProperty({
    description: 'Name of the attribute',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Name of the attribute',
    example: '',
  })
  @IsNotEmpty()
  @IsIn(Object.values(DataTypeAttribute))
  @IsString()
  dataType: string;
}

export class FindAllAttributeDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the attribute',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Datatype of the attribute',
    example: '',
    enum: DataTypeAttribute,
    required: false,
  })
  @IsOptional()
  @IsIn(Object.values(DataTypeAttribute))
  @IsString()
  dataType?: string;
}

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}
