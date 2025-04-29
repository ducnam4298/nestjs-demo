import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiscountAssign, DiscountStatus, PaginationRequestDto } from '@/shared';

export class Discount {}

export class CreateDiscountDto {
  @ApiProperty({
    description: 'Name of the discount',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'DiscountAssign of the discount',
    example: '',
    enum: DiscountAssign,
  })
  @IsIn(Object.values(DiscountAssign))
  @IsNotEmpty()
  @IsString()
  discountAssign: DiscountAssign;

  @ApiProperty({
    description: 'Value of the discount',
    example: '',
  })
  @IsNotEmpty()
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'StartDate of the discount',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  startDate: string | Date;

  @ApiProperty({
    description: 'EndDate of the discount',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  endDate: string | Date;

  @ApiProperty({
    description: 'IsPercentage of the discount',
    example: '',
  })
  @IsNotEmpty()
  @IsBoolean()
  isPercentage: boolean;

  @ApiProperty({
    description: 'DiscountStatus of the discount',
    example: '',
    enum: DiscountStatus,
  })
  @IsIn(Object.values(DiscountStatus))
  @IsNotEmpty()
  @IsString()
  status: DiscountStatus;
}

export class FindAllDiscountDto extends PartialType(PaginationRequestDto) {
  @ApiProperty({
    description: 'Name of the discount',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'DiscountAssign of the discount',
    example: '',
    enum: DiscountAssign,
    required: false,
  })
  @IsIn(Object.values(DiscountAssign))
  @IsOptional()
  @IsString()
  discountAssign: DiscountAssign;

  @ApiProperty({
    description: 'Value of the discount',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'StartDate of the discount',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate: string | Date;

  @ApiProperty({
    description: 'EndDate of the discount',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate: string | Date;

  @ApiProperty({
    description: 'IsPercentage of the discount',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPercentage: boolean;

  @ApiProperty({
    description: 'DiscountStatus of the discount',
    example: '',
    enum: DiscountStatus,
    required: false,
  })
  @IsIn(Object.values(DiscountStatus))
  @IsOptional()
  @IsString()
  status: DiscountStatus;
}

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}
